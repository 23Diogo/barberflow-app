import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
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

interface Props {
  appointment: any
  onPress: () => void
}

export default function AppointmentCard({ appointment: apt, onPress }: Props) {
  const client  = apt.clients
  const service = apt.services
  const status  = STATUS_META[apt.status] || STATUS_META.pending
  const time    = format(new Date(apt.scheduled_at), 'HH:mm')
  const price   = apt.final_price || service?.price || 0

  const initials = String(client?.name || 'C')
    .split(' ')
    .slice(0, 2)
    .map((p: string) => p[0]?.toUpperCase())
    .join('')

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      {/* Linha de tempo */}
      <View style={[styles.timeLine, { backgroundColor: status.color }]} />

      {/* Horário */}
      <View style={styles.timeCol}>
        <Text style={styles.time}>{time}</Text>
        <Text style={styles.duration}>{service?.duration_min || 30}m</Text>
      </View>

      {/* Avatar */}
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{initials}</Text>
      </View>

      {/* Info */}
      <View style={styles.info}>
        <Text style={styles.clientName} numberOfLines={1}>{client?.name || 'Cliente'}</Text>
        <Text style={styles.serviceName} numberOfLines={1}>{service?.name || 'Serviço'}</Text>
      </View>

      {/* Direita */}
      <View style={styles.right}>
        <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
          <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
        </View>
        <Text style={styles.price}>R${Number(price).toFixed(0)}</Text>
      </View>

      <Ionicons name="chevron-forward" size={16} color="#3a4568" />
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  card:        { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#0a0c1a', borderRadius: 12, borderWidth: 1, borderColor: '#1e2345', padding: 12, marginBottom: 8 },
  timeLine:    { width: 3, height: '100%', borderRadius: 2, position: 'absolute', left: 0, top: 0, bottom: 0 },
  timeCol:     { alignItems: 'center', width: 40, marginLeft: 6 },
  time:        { fontSize: 14, fontWeight: '800', color: '#e8f0fe' },
  duration:    { fontSize: 10, color: '#3a4568', marginTop: 2 },
  avatar:      { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(79,195,247,0.15)', alignItems: 'center', justifyContent: 'center' },
  avatarText:  { fontSize: 13, fontWeight: '800', color: '#4fc3f7' },
  info:        { flex: 1 },
  clientName:  { fontSize: 13, fontWeight: '700', color: '#e8f0fe' },
  serviceName: { fontSize: 11, color: '#5a6888', marginTop: 2 },
  right:       { alignItems: 'flex-end', gap: 4 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  statusText:  { fontSize: 9, fontWeight: '700' },
  price:       { fontSize: 12, fontWeight: '800', color: '#4fc3f7' },
})
