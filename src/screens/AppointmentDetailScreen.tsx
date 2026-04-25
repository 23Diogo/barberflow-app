import React from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, Linking, Alert, Image,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  completed:   { label: 'Concluído',     color: '#00e676', bg: 'rgba(0,230,118,0.1)' },
  confirmed:   { label: 'Confirmado',    color: '#4fc3f7', bg: 'rgba(79,195,247,0.1)' },
  pending:     { label: 'Agendado',      color: '#ffd700', bg: 'rgba(255,215,0,0.1)' },
  cancelled:   { label: 'Cancelado',     color: '#ff1744', bg: 'rgba(255,23,68,0.1)' },
  in_progress: { label: 'Em andamento',  color: '#9c6fff', bg: 'rgba(156,111,255,0.1)' },
  no_show:     { label: 'Não compareceu',color: '#f97316', bg: 'rgba(249,115,22,0.1)' },
}

export default function AppointmentDetailScreen({ route, navigation }: any) {
  const { appointment: apt } = route.params
  const client  = apt.clients
  const service = apt.services
  const status  = STATUS_META[apt.status] || STATUS_META.pending

  const scheduledDate = new Date(apt.scheduled_at)
  const dateStr = format(scheduledDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
  const timeStr = format(scheduledDate, 'HH:mm')

  function openWhatsApp() {
    const phone = String(client?.whatsapp || client?.phone || '')
      .replace(/\D/g, '')
    if (!phone) {
      Alert.alert('Atenção', 'Este cliente não tem WhatsApp cadastrado.')
      return
    }

    const shopName = ''
    const msg = encodeURIComponent(
      `Olá, ${client?.name?.split(' ')[0]}! 👋\n\nPassando para confirmar seu horário de hoje às *${timeStr}*.\n\nAté logo! 💈`
    )
    Linking.openURL(`https://wa.me/${phone}?text=${msg}`)
  }

  function callClient() {
    const phone = String(client?.phone || client?.whatsapp || '').replace(/\D/g, '')
    if (!phone) {
      Alert.alert('Atenção', 'Este cliente não tem telefone cadastrado.')
      return
    }
    Linking.openURL(`tel:+${phone}`)
  }

  const initials = String(client?.name || 'C')
    .split(' ')
    .slice(0, 2)
    .map((p: string) => p[0]?.toUpperCase())
    .join('')

  return (
    <View style={styles.container}>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#4fc3f7" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detalhes</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>

        {/* Cliente */}
        <View style={styles.clientCard}>
          <View style={styles.avatar}>
            {client?.avatar_url
              ? <Image source={{ uri: client.avatar_url }} style={styles.avatarImg} />
              : <Text style={styles.avatarText}>{initials}</Text>
            }
          </View>
          <View style={styles.clientInfo}>
            <Text style={styles.clientName}>{client?.name || 'Cliente'}</Text>
            <Text style={styles.clientPhone}>
              {client?.whatsapp || client?.phone || 'Sem contato'}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
            <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
          </View>
        </View>

        {/* Info do agendamento */}
        <View style={styles.card}>
          <InfoRow icon="cut-outline"      label="Serviço"    value={service?.name || '—'} />
          <InfoRow icon="calendar-outline" label="Data"       value={dateStr} />
          <InfoRow icon="time-outline"     label="Horário"    value={timeStr} />
          <InfoRow icon="timer-outline"    label="Duração"    value={`${service?.duration_min || 30} min`} />
          <InfoRow icon="cash-outline"     label="Valor"
            value={apt.final_price
              ? `R$ ${Number(apt.final_price).toFixed(2)}`
              : `R$ ${Number(service?.price || 0).toFixed(2)}`}
          />
          {apt.notes && (
            <InfoRow icon="document-text-outline" label="Obs." value={apt.notes} />
          )}
        </View>

        {/* Ações */}
        <View style={styles.actionsCard}>
          <Text style={styles.actionsTitle}>AÇÕES</Text>

          <TouchableOpacity style={styles.actionBtn} onPress={openWhatsApp} activeOpacity={0.8}>
            <View style={[styles.actionIcon, { backgroundColor: '#063020' }]}>
              <Ionicons name="logo-whatsapp" size={22} color="#25D366" />
            </View>
            <View style={styles.actionInfo}>
              <Text style={styles.actionLabel}>Enviar mensagem no WhatsApp</Text>
              <Text style={styles.actionSub}>Abre o WhatsApp com mensagem pré-pronta</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#3a4568" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionBtn} onPress={callClient} activeOpacity={0.8}>
            <View style={[styles.actionIcon, { backgroundColor: '#0e1e38' }]}>
              <Ionicons name="call-outline" size={22} color="#4fc3f7" />
            </View>
            <View style={styles.actionInfo}>
              <Text style={styles.actionLabel}>Ligar para o cliente</Text>
              <Text style={styles.actionSub}>Abre o discador do celular</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#3a4568" />
          </TouchableOpacity>
        </View>

      </ScrollView>
    </View>
  )
}

function InfoRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Ionicons name={icon as any} size={18} color="#4fc3f7" />
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: '#050816' },
  header:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 56, paddingBottom: 12 },
  backBtn:     { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 16, fontWeight: '700', color: '#e8f0fe' },
  content:     { padding: 16, gap: 14, paddingBottom: 40 },
  clientCard:  { backgroundColor: '#0a0c1a', borderRadius: 14, borderWidth: 1, borderColor: '#1e2345', padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar:      { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(79,195,247,0.15)', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  avatarImg:   { width: 48, height: 48, borderRadius: 24 },
  avatarText:  { fontSize: 16, fontWeight: '800', color: '#4fc3f7' },
  clientInfo:  { flex: 1 },
  clientName:  { fontSize: 15, fontWeight: '700', color: '#e8f0fe' },
  clientPhone: { fontSize: 12, color: '#5a6888', marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusText:  { fontSize: 11, fontWeight: '700' },
  card:        { backgroundColor: '#0a0c1a', borderRadius: 14, borderWidth: 1, borderColor: '#1e2345', padding: 16, gap: 14 },
  infoRow:     { flexDirection: 'row', alignItems: 'center', gap: 10 },
  infoLabel:   { fontSize: 12, color: '#5a6888', width: 70 },
  infoValue:   { flex: 1, fontSize: 13, color: '#e8f0fe', fontWeight: '600' },
  actionsCard: { backgroundColor: '#0a0c1a', borderRadius: 14, borderWidth: 1, borderColor: '#1e2345', padding: 16, gap: 10 },
  actionsTitle:{ fontSize: 10, fontWeight: '700', color: '#3a4568', letterSpacing: 1, marginBottom: 4 },
  actionBtn:   { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.02)', borderWidth: 1, borderColor: '#1e2345' },
  actionIcon:  { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  actionInfo:  { flex: 1 },
  actionLabel: { fontSize: 13, fontWeight: '600', color: '#e8f0fe' },
  actionSub:   { fontSize: 11, color: '#5a6888', marginTop: 2 },
})
