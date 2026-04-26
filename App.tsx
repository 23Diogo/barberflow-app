import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, ScrollView, FlatList,
  RefreshControl, Linking,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'https://api.bbarberflow.com.br';
const TOKEN_KEY = 'barberflow_barber_token';

// ─── API ──────────────────────────────────────────────────────────────────────

async function apiFetch(path, options = {}) {
  const token = await AsyncStorage.getItem(TOKEN_KEY);
  const res = await fetch(API_URL + path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Erro na requisição');
  return data;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  const today = new Date();
  if (d.toDateString() === today.toDateString()) return 'Hoje';
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

function addDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

function addWeeks(date, n) { return addDays(date, n * 7); }
function addMonths(date, n) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + n);
  return d;
}

const STATUS = {
  completed:   { label: 'Concluído',    color: '#00e676', bg: 'rgba(0,230,118,0.15)' },
  confirmed:   { label: 'Confirmado',   color: '#4fc3f7', bg: 'rgba(79,195,247,0.15)' },
  pending:     { label: 'Agendado',     color: '#ffd700', bg: 'rgba(255,215,0,0.15)' },
  cancelled:   { label: 'Cancelado',    color: '#ff1744', bg: 'rgba(255,23,68,0.15)' },
  in_progress: { label: 'Em andamento', color: '#9c6fff', bg: 'rgba(156,111,255,0.15)' },
  no_show:     { label: 'Faltou',       color: '#f97316', bg: 'rgba(249,115,22,0.15)' },
};

// ─── Tela de Login ────────────────────────────────────────────────────────────

function LoginScreen({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Atenção', 'Informe email e senha.');
      return;
    }
    setLoading(true);
    try {
      const data = await apiFetch('/api/barber-auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      });
      await AsyncStorage.setItem(TOKEN_KEY, data.token);
      onLogin(data);
    } catch (err) {
      Alert.alert('Erro', err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={s.loginScroll} keyboardShouldPersistTaps="handled">
      <View style={s.logoRow}>
        <View style={s.logoMark}><Text style={s.logoLetter}>B</Text></View>
        <View>
          <Text style={s.logoTitle}>BarberFlow</Text>
          <Text style={s.logoSub}>ÁREA DO BARBEIRO</Text>
        </View>
      </View>
      <View style={s.card}>
        <Text style={s.cardTitle}>Entrar</Text>
        <Text style={s.cardSub}>Acesse sua agenda de atendimentos</Text>
        <Text style={s.label}>E-MAIL</Text>
        <TextInput style={s.input} placeholder="seu@email.com" placeholderTextColor="#3a4568"
          value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
        <Text style={s.label}>SENHA</Text>
        <TextInput style={s.input} placeholder="••••••••" placeholderTextColor="#3a4568"
          value={password} onChangeText={setPassword} secureTextEntry />
        <TouchableOpacity style={[s.btn, loading && s.btnOff]} onPress={handleLogin} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>Entrar</Text>}
        </TouchableOpacity>
        <Text style={s.hint}>Esqueceu a senha? Fale com o dono da barbearia.</Text>
      </View>
    </ScrollView>
  );
}

// ─── Card de agendamento ──────────────────────────────────────────────────────

function AppCard({ apt, onPress }) {
  const client = apt.clients;
  const service = apt.services;
  const st = STATUS[apt.status] || STATUS.pending;
  const initials = String(client?.name || 'C').split(' ').slice(0, 2).map(p => p[0]?.toUpperCase()).join('');

  return (
    <TouchableOpacity style={s.apCard} onPress={onPress} activeOpacity={0.8}>
      <View style={[s.apLine, { backgroundColor: st.color }]} />
      <View style={s.apTime}>
        <Text style={s.apTimeText}>{formatTime(apt.scheduled_at)}</Text>
        <Text style={s.apDur}>{service?.duration_min || 30}m</Text>
      </View>
      <View style={s.apAvatar}><Text style={s.apAvatarText}>{initials}</Text></View>
      <View style={{ flex: 1 }}>
        <Text style={s.apName} numberOfLines={1}>{client?.name || 'Cliente'}</Text>
        <Text style={s.apService} numberOfLines={1}>{service?.name || 'Serviço'}</Text>
      </View>
      <View style={{ alignItems: 'flex-end', gap: 4 }}>
        <View style={[s.apBadge, { backgroundColor: st.bg }]}>
          <Text style={[s.apBadgeText, { color: st.color }]}>{st.label}</Text>
        </View>
        <Text style={s.apPrice}>R${Number(apt.final_price || service?.price || 0).toFixed(0)}</Text>
      </View>
    </TouchableOpacity>
  );
}

// ─── Tela de Agenda ───────────────────────────────────────────────────────────

function AgendaScreen({ auth, onLogout, onDetail }) {
  const [period, setPeriod] = useState('day');
  const [date, setDate] = useState(new Date());
  const [apts, setApts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (showLoader = true) => {
  if (showLoader) setLoading(true);
  try {
    const dateStr = date.toISOString().split('T')[0];
    const url = `/api/barber-auth/appointments?period=${period}&date=${dateStr}`;
    Alert.alert('Debug URL', url);
    const data = await apiFetch(url);
    Alert.alert('Debug Data', JSON.stringify(data).substring(0, 300));
    setApts(Array.isArray(data) ? data : []);
  } catch(err) {
    Alert.alert('Erro', err.message);
    setApts([]);
  } finally {
    setLoading(false);
    setRefreshing(false);
  }
}, [period, date]);

  useEffect(() => { load(); }, [load]);

  function nav(dir) {
    setDate(prev =>
      period === 'day'   ? addDays(prev, dir) :
      period === 'week'  ? addWeeks(prev, dir) :
                           addMonths(prev, dir)
    );
  }

  function dateLabel() {
    const today = new Date();
    if (period === 'day') {
      if (date.toDateString() === today.toDateString()) return 'Hoje';
      return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' });
    }
    if (period === 'week') {
      const start = new Date(date);
      start.setDate(date.getDate() - date.getDay());
      const end = addDays(start, 6);
      return `${start.toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit'})} – ${end.toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit'})}`;
    }
    return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  }

  const done = apts.filter(a => a.status === 'completed').length;
  const pending = apts.filter(a => ['pending','confirmed'].includes(a.status)).length;
  const revenue = apts.filter(a => a.status === 'completed').reduce((s,a) => s + Number(a.final_price||0), 0);

  return (
    <View style={{ flex: 1, backgroundColor: '#050816' }}>
      {/* Header */}
      <View style={s.header}>
        <View>
          <Text style={s.greeting}>Olá, {auth.user?.name?.split(' ')[0]} 👋</Text>
          <Text style={s.shopName}>{auth.barbershop?.name}</Text>
        </View>
        <TouchableOpacity onPress={onLogout} style={s.logoutBtn}>
          <Text style={{ color: '#5a6888', fontSize: 22 }}>⎋</Text>
        </TouchableOpacity>
      </View>

      {/* Period tabs */}
      <View style={s.tabs}>
        {['day','week','month'].map(p => (
          <TouchableOpacity key={p} style={[s.tab, period===p && s.tabActive]} onPress={() => setPeriod(p)}>
            <Text style={[s.tabText, period===p && s.tabTextActive]}>
              {p==='day'?'Dia':p==='week'?'Semana':'Mês'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Date nav */}
      <View style={s.dateNav}>
        <TouchableOpacity onPress={() => nav(-1)} style={s.navBtn}><Text style={s.navArrow}>‹</Text></TouchableOpacity>
        <Text style={s.dateLabel}>{dateLabel()}</Text>
        <TouchableOpacity onPress={() => nav(1)} style={s.navBtn}><Text style={s.navArrow}>›</Text></TouchableOpacity>
      </View>

      {/* Stats */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ paddingHorizontal: 16, marginBottom: 12 }}>
        {[
          { label: 'Total',   value: String(apts.length), color: '#4fc3f7' },
          { label: 'Feitos',  value: String(done),        color: '#00e676' },
          { label: 'Aguard.', value: String(pending),     color: '#ffd700' },
          { label: 'Receita', value: `R$${revenue.toFixed(0)}`, color: '#9c6fff' },
        ].map(st => (
          <View key={st.label} style={[s.stat, { borderColor: st.color + '40' }]}>
            <Text style={[s.statVal, { color: st.color }]}>{st.value}</Text>
            <Text style={s.statLbl}>{st.label}</Text>
          </View>
        ))}
      </ScrollView>

      {/* List */}
      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color="#4fc3f7" size="large" />
        </View>
      ) : (
        <FlatList
          data={apts}
          keyExtractor={i => i.id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(false); }} tintColor="#4fc3f7" />}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', paddingTop: 60 }}>
              <Text style={{ fontSize: 40 }}>📅</Text>
              <Text style={{ color: '#3a4568', marginTop: 12 }}>Nenhum agendamento neste período</Text>
            </View>
          }
          renderItem={({ item }) => (
            <AppCard apt={item} onPress={() => onDetail(item)} />
          )}
        />
      )}
    </View>
  );
}

// ─── Tela de Detalhe ──────────────────────────────────────────────────────────

function DetailScreen({ apt, onBack }) {
  const client = apt.clients;
  const service = apt.services;
  const st = STATUS[apt.status] || STATUS.pending;
  const d = new Date(apt.scheduled_at);
  const dateStr = d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
  const timeStr = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  const initials = String(client?.name || 'C').split(' ').slice(0, 2).map(p => p[0]?.toUpperCase()).join('');

  function openWhatsApp() {
    const phone = String(client?.whatsapp || client?.phone || '').replace(/\D/g, '');
    if (!phone) { Alert.alert('Atenção', 'Cliente sem WhatsApp cadastrado.'); return; }
    const msg = encodeURIComponent(`Olá, ${client?.name?.split(' ')[0]}! 👋\n\nPassando para confirmar seu horário de hoje às *${timeStr}*.\n\nAté logo! 💈`);
    Linking.openURL(`https://wa.me/${phone}?text=${msg}`);
  }

  function callClient() {
    const phone = String(client?.phone || client?.whatsapp || '').replace(/\D/g, '');
    if (!phone) { Alert.alert('Atenção', 'Cliente sem telefone cadastrado.'); return; }
    Linking.openURL(`tel:+${phone}`);
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#050816' }}>
      <View style={s.detHeader}>
        <TouchableOpacity onPress={onBack} style={s.backBtn}>
          <Text style={{ color: '#4fc3f7', fontSize: 24 }}>‹</Text>
        </TouchableOpacity>
        <Text style={s.detTitle}>Detalhes</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 40 }}>
        {/* Cliente */}
        <View style={s.clientCard}>
          <View style={s.detAvatar}><Text style={s.detAvatarText}>{initials}</Text></View>
          <View style={{ flex: 1 }}>
            <Text style={s.clientName}>{client?.name || 'Cliente'}</Text>
            <Text style={s.clientPhone}>{client?.whatsapp || client?.phone || 'Sem contato'}</Text>
          </View>
          <View style={[s.apBadge, { backgroundColor: st.bg }]}>
            <Text style={[s.apBadgeText, { color: st.color }]}>{st.label}</Text>
          </View>
        </View>

        {/* Info */}
        <View style={s.infoCard}>
          {[
            ['✂️', 'Serviço',  service?.name || '—'],
            ['📅', 'Data',     dateStr],
            ['🕐', 'Horário',  timeStr],
            ['⏱',  'Duração',  `${service?.duration_min || 30} min`],
            ['💰', 'Valor',    `R$ ${Number(apt.final_price || service?.price || 0).toFixed(2)}`],
          ].map(([icon, label, value]) => (
            <View key={label} style={s.infoRow}>
              <Text style={{ fontSize: 16, width: 28 }}>{icon}</Text>
              <Text style={s.infoLabel}>{label}</Text>
              <Text style={s.infoValue} numberOfLines={2}>{value}</Text>
            </View>
          ))}
          {apt.notes ? (
            <View style={s.infoRow}>
              <Text style={{ fontSize: 16, width: 28 }}>📝</Text>
              <Text style={s.infoLabel}>Obs.</Text>
              <Text style={s.infoValue}>{apt.notes}</Text>
            </View>
          ) : null}
        </View>

        {/* Ações */}
        <View style={s.actCard}>
          <Text style={s.actTitle}>AÇÕES</Text>
          <TouchableOpacity style={s.actBtn} onPress={openWhatsApp} activeOpacity={0.8}>
            <View style={[s.actIcon, { backgroundColor: '#063020' }]}>
              <Text style={{ fontSize: 20 }}>💬</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.actLabel}>Enviar mensagem no WhatsApp</Text>
              <Text style={s.actSub}>Abre o WhatsApp com mensagem pré-pronta</Text>
            </View>
            <Text style={{ color: '#3a4568' }}>›</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.actBtn} onPress={callClient} activeOpacity={0.8}>
            <View style={[s.actIcon, { backgroundColor: '#0e1e38' }]}>
              <Text style={{ fontSize: 20 }}>📞</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.actLabel}>Ligar para o cliente</Text>
              <Text style={s.actSub}>Abre o discador do celular</Text>
            </View>
            <Text style={{ color: '#3a4568' }}>›</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

// ─── App principal ────────────────────────────────────────────────────────────

export default function App() {
  const [screen, setScreen] = useState('loading');
  const [auth, setAuth] = useState(null);
  const [detail, setDetail] = useState(null);

  useEffect(() => {
    async function init() {
      try {
        const token = await AsyncStorage.getItem(TOKEN_KEY);
        if (token) {
          const data = await apiFetch('/api/barber-auth/me');
          setAuth(data);
          setScreen('agenda');
        } else {
          setScreen('login');
        }
      } catch {
        setScreen('login');
      }
    }
    init();
  }, []);

  async function handleLogout() {
    await AsyncStorage.removeItem(TOKEN_KEY);
    setAuth(null);
    setScreen('login');
  }

  if (screen === 'loading') {
    return (
      <View style={{ flex: 1, backgroundColor: '#050816', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color="#4fc3f7" size="large" />
      </View>
    );
  }

  if (screen === 'login') {
    return (
      <View style={{ flex: 1, backgroundColor: '#050816' }}>
        <LoginScreen onLogin={data => { setAuth(data); setScreen('agenda'); }} />
      </View>
    );
  }

  if (screen === 'detail' && detail) {
    return <DetailScreen apt={detail} onBack={() => setScreen('agenda')} />;
  }

  return (
    <AgendaScreen
      auth={auth}
      onLogout={handleLogout}
      onDetail={apt => { setDetail(apt); setScreen('detail'); }}
    />
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  // Login
  loginScroll: { flexGrow: 1, backgroundColor: '#050816', justifyContent: 'center', padding: 24 },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 40, alignSelf: 'center' },
  logoMark: { width: 52, height: 52, borderRadius: 14, backgroundColor: '#120600', borderWidth: 1, borderColor: 'rgba(255,100,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  logoLetter: { fontSize: 26, fontWeight: '900', color: '#ff8c00' },
  logoTitle: { fontSize: 22, fontWeight: '900', color: '#e8f0fe', letterSpacing: 1 },
  logoSub: { fontSize: 10, color: '#4fc3f7', letterSpacing: 2, marginTop: 2 },
  card: { backgroundColor: '#0c1020', borderRadius: 16, borderWidth: 1, borderColor: '#1e2345', padding: 24 },
  cardTitle: { fontSize: 20, fontWeight: '800', color: '#e8f0fe', marginBottom: 4 },
  cardSub: { fontSize: 12, color: '#5a6888', marginBottom: 24 },
  label: { fontSize: 10, fontWeight: '700', color: '#5a6888', letterSpacing: 1, marginBottom: 6 },
  input: { backgroundColor: '#0e1022', borderWidth: 1, borderColor: '#232845', borderRadius: 10, padding: 13, fontSize: 14, color: '#e8f0fe', marginBottom: 16 },
  btn: { backgroundColor: '#00b4ff', borderRadius: 10, padding: 15, alignItems: 'center', marginTop: 8 },
  btnOff: { opacity: 0.6 },
  btnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  hint: { fontSize: 11, color: '#3a4568', textAlign: 'center', marginTop: 16 },
  // Agenda
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 56 },
  greeting: { fontSize: 18, fontWeight: '800', color: '#e8f0fe' },
  shopName: { fontSize: 12, color: '#5a6888', marginTop: 2 },
  logoutBtn: { padding: 8 },
  tabs: { flexDirection: 'row', marginHorizontal: 16, gap: 8, marginBottom: 12 },
  tab: { flex: 1, padding: 10, borderRadius: 10, borderWidth: 1, borderColor: '#1e2345', alignItems: 'center' },
  tabActive: { borderColor: '#4fc3f7', backgroundColor: 'rgba(79,195,247,0.1)' },
  tabText: { fontSize: 13, fontWeight: '600', color: '#5a6888' },
  tabTextActive: { color: '#4fc3f7' },
  dateNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginHorizontal: 16, marginBottom: 12 },
  navBtn: { padding: 8 },
  navArrow: { fontSize: 28, color: '#4fc3f7', fontWeight: '300' },
  dateLabel: { fontSize: 15, fontWeight: '700', color: '#e8f0fe' },
  stat: { backgroundColor: '#0a0c1a', borderRadius: 12, borderWidth: 1, padding: 14, marginRight: 10, minWidth: 80, alignItems: 'center' },
  statVal: { fontSize: 20, fontWeight: '900' },
  statLbl: { fontSize: 10, color: '#5a6888', marginTop: 2 },
  // Card
  apCard: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#0a0c1a', borderRadius: 12, borderWidth: 1, borderColor: '#1e2345', padding: 12, marginBottom: 8 },
  apLine: { width: 3, borderRadius: 2, position: 'absolute', left: 0, top: 0, bottom: 0 },
  apTime: { alignItems: 'center', width: 40, marginLeft: 6 },
  apTimeText: { fontSize: 14, fontWeight: '800', color: '#e8f0fe' },
  apDur: { fontSize: 10, color: '#3a4568', marginTop: 2 },
  apAvatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(79,195,247,0.15)', alignItems: 'center', justifyContent: 'center' },
  apAvatarText: { fontSize: 13, fontWeight: '800', color: '#4fc3f7' },
  apName: { fontSize: 13, fontWeight: '700', color: '#e8f0fe' },
  apService: { fontSize: 11, color: '#5a6888', marginTop: 2 },
  apBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  apBadgeText: { fontSize: 9, fontWeight: '700' },
  apPrice: { fontSize: 12, fontWeight: '800', color: '#4fc3f7' },
  // Detail
  detHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 56, paddingBottom: 12 },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  detTitle: { fontSize: 16, fontWeight: '700', color: '#e8f0fe' },
  clientCard: { backgroundColor: '#0a0c1a', borderRadius: 14, borderWidth: 1, borderColor: '#1e2345', padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12 },
  detAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(79,195,247,0.15)', alignItems: 'center', justifyContent: 'center' },
  detAvatarText: { fontSize: 16, fontWeight: '800', color: '#4fc3f7' },
  clientName: { fontSize: 15, fontWeight: '700', color: '#e8f0fe' },
  clientPhone: { fontSize: 12, color: '#5a6888', marginTop: 2 },
  infoCard: { backgroundColor: '#0a0c1a', borderRadius: 14, borderWidth: 1, borderColor: '#1e2345', padding: 16, gap: 14 },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  infoLabel: { fontSize: 12, color: '#5a6888', width: 70 },
  infoValue: { flex: 1, fontSize: 13, color: '#e8f0fe', fontWeight: '600' },
  actCard: { backgroundColor: '#0a0c1a', borderRadius: 14, borderWidth: 1, borderColor: '#1e2345', padding: 16, gap: 10 },
  actTitle: { fontSize: 10, fontWeight: '700', color: '#3a4568', letterSpacing: 1, marginBottom: 4 },
  actBtn: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.02)', borderWidth: 1, borderColor: '#1e2345' },
  actIcon: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  actLabel: { fontSize: 13, fontWeight: '600', color: '#e8f0fe' },
  actSub: { fontSize: 11, color: '#5a6888', marginTop: 2 },
});
