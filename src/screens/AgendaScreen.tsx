import React, { useState, useEffect, useCallback } from 'react'
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, RefreshControl, ActivityIndicator,
  ScrollView,
} from 'react-native'
import { format, addDays, subDays, startOfWeek, addWeeks, subWeeks,
         startOfMonth, addMonths, subMonths, isSameDay } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Ionicons } from '@expo/vector-icons'
import { getAppointments, Period } from '../api/api'
import { useAuth } from '../store/AuthContext'
import AppointmentCard from '../components/AppointmentCard'

const PERIODS: { key: Period; label: string }[] = [
  { key: 'day',   label: 'Dia'   },
  { key: 'week',  label: 'Semana' },
  { key: 'month', label: 'Mês'   },
]

const STATUS_COLORS: Record<string, string> = {
  completed:   '#00e676',
  confirmed:   '#4fc3f7',
  pending:     '#ffd700',
  cancelled:   '#ff1744',
  in_progress: '#9c6fff',
  no_show:     '#f97316',
}

export default function AgendaScreen({ navigation }: any) {
  const { user, barbershop, logout } = useAuth()
  const [period,      setPeriod]      = useState<Period>('day')
  const [date,        setDate]        = useState(new Date())
  const [appointments, setAppointments] = useState<any[]>([])
  const [loading,     setLoading]     = useState(true)
  const [refreshing,  setRefreshing]  = useState(false)

  const load = useCallback(async (showLoader = true) => {
    if (showLoader) setLoading(true)
    try {
      const data = await getAppointments(period, date)
      setAppointments(data || [])
    } catch {
      setAppointments([])
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [period, date])

  useEffect(() => { load() }, [load])

  function navigate(dir: 1 | -1) {
    setDate(prev => {
      if (period === 'day')   return dir > 0 ? addDays(prev, 1)    : subDays(prev, 1)
      if (period === 'week')  return dir > 0 ? addWeeks(prev, 1)   : subWeeks(prev, 1)
      return                         dir > 0 ? addMonths(prev, 1)  : subMonths(prev, 1)
    })
  }

  function getDateLabel() {
    if (period === 'day') {
      if (isSameDay(date, new Date())) return 'Hoje'
      return format(date, "dd 'de' MMMM", { locale: ptBR })
    }
    if (period === 'week') {
      const start = startOfWeek(date, { weekStartsOn: 0 })
      const end   = addDays(start, 6)
      return `${format(start, 'dd/MM')} – ${format(end, 'dd/MM')}`
    }
    return format(startOfMonth(date), 'MMMM yyyy', { locale: ptBR })
  }

  // Estatísticas rápidas
  const total     = appointments.length
  const done      = appointments.filter(a => a.status === 'completed').length
  const pending   = appointments.filter(a => ['pending','confirmed'].includes(a.status)).length
  const revenue   = appointments
    .filter(a => a.status === 'completed')
    .reduce((sum, a) => sum + Number(a.final_price || 0), 0)

  return (
    <View style={styles.container}>

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Olá, {user?.name?.split(' ')[0]} 👋</Text>
          <Text style={styles.shopName}>{barbershop?.name}</Text>
        </View>
        <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
          <Ionicons name="log-out-outline" size={22} color="#5a6888" />
        </TouchableOpacity>
      </View>

      {/* Period selector */}
      <View style={styles.periodRow}>
        {PERIODS.map(p => (
          <TouchableOpacity
            key={p.key}
            style={[styles.periodBtn, period === p.key && styles.periodBtnActive]}
            onPress={() => setPeriod(p.key)}
          >
            <Text style={[styles.periodLabel, period === p.key && styles.periodLabelActive]}>
              {p.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Date navigator */}
      <View style={styles.dateNav}>
        <TouchableOpacity onPress={() => navigate(-1)} style={styles.navBtn}>
          <Ionicons name="chevron-back" size={20} color="#4fc3f7" />
        </TouchableOpacity>
        <Text style={styles.dateLabel}>{getDateLabel()}</Text>
        <TouchableOpacity onPress={() => navigate(1)} style={styles.navBtn}>
          <Ionicons name="chevron-forward" size={20} color="#4fc3f7" />
        </TouchableOpacity>
      </View>

      {/* Stats */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statsRow}>
        <StatCard label="Total"    value={String(total)}   color="#4fc3f7" />
        <StatCard label="Feitos"   value={String(done)}    color="#00e676" />
        <StatCard label="Aguard."  value={String(pending)} color="#ffd700" />
        <StatCard label="Receita"  value={`R$${revenue.toFixed(0)}`} color="#9c6fff" />
      </ScrollView>

      {/* List */}
      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator color="#4fc3f7" size="large" />
        </View>
      ) : (
        <FlatList
          data={appointments}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); load(false) }}
              tintColor="#4fc3f7"
            />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="calendar-outline" size={48} color="#1e2345" />
              <Text style={styles.emptyText}>Nenhum agendamento neste período</Text>
            </View>
          }
          renderItem={({ item }) => (
            <AppointmentCard
              appointment={item}
              onPress={() => navigation.navigate('Detail', { appointment: item })}
            />
          )}
        />
      )}
    </View>
  )
}

function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={[styles.statCard, { borderColor: color + '30' }]}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container:  { flex: 1, backgroundColor: '#050816' },
  header:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 56 },
  greeting:   { fontSize: 18, fontWeight: '800', color: '#e8f0fe' },
  shopName:   { fontSize: 12, color: '#5a6888', marginTop: 2 },
  logoutBtn:  { padding: 8 },
  periodRow:  { flexDirection: 'row', marginHorizontal: 16, gap: 8, marginBottom: 12 },
  periodBtn:  { flex: 1, padding: 10, borderRadius: 10, borderWidth: 1, borderColor: '#1e2345', alignItems: 'center' },
  periodBtnActive: { borderColor: '#4fc3f7', backgroundColor: 'rgba(79,195,247,0.1)' },
  periodLabel: { fontSize: 13, fontWeight: '600', color: '#5a6888' },
  periodLabelActive: { color: '#4fc3f7' },
  dateNav:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginHorizontal: 16, marginBottom: 12 },
  navBtn:     { padding: 8 },
  dateLabel:  { fontSize: 15, fontWeight: '700', color: '#e8f0fe', textTransform: 'capitalize' },
  statsRow:   { paddingHorizontal: 16, marginBottom: 12 },
  statCard:   { backgroundColor: '#0a0c1a', borderRadius: 12, borderWidth: 1, padding: 14, marginRight: 10, minWidth: 80, alignItems: 'center' },
  statValue:  { fontSize: 20, fontWeight: '900' },
  statLabel:  { fontSize: 10, color: '#5a6888', marginTop: 2 },
  list:       { paddingHorizontal: 16, paddingBottom: 24 },
  loader:     { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty:      { alignItems: 'center', justifyContent: 'center', paddingTop: 60, gap: 12 },
  emptyText:  { color: '#3a4568', fontSize: 14 },
})
