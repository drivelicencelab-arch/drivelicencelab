import { useState, useEffect } from 'react'
import { supabase } from '../../supabase.js'
import { T, GlassCard, NeuBtn, Alert, ProgressBar, Badge } from '../../ui.jsx'

// ── Coin award triggers ───────────────────────────────────────────────────────
export const COIN_EVENTS = {
  SIM_SESSION_COMPLETE: { coins: 50, label: 'Sim session completed', icon: '🎮' },
  PASS_PREDICTOR_70: { coins: 100, label: 'Reached 70% pass probability', icon: '📊' },
  PASS_PREDICTOR_85: { coins: 250, label: 'Reached 85% pass probability', icon: '🎯' },
  GOAL_WEEK_ON_TRACK: { coins: 75, label: 'On track with goal date plan', icon: '📅' },
  FRIEND_DUEL_WIN: { coins: 50, label: 'Won a friend duel', icon: '⚔️' },
  CLEAN_SESSION_STREAK: { coins: 500, label: '5 distraction-free lessons', icon: '📵' },
  REFERRAL: { coins: 200, label: 'Referred a classmate', icon: '👥' },
  PERFECT_QUIZ: { coins: 100, label: 'Perfect quiz score', icon: '💯' },
  FIRST_LESSON: { coins: 150, label: 'First lesson completed', icon: '🚗' },
}

// ── Redemption catalogue ──────────────────────────────────────────────────────
const REDEMPTIONS = [
  { id: 'lesson_discount_10', coins: 500, label: '10% Lesson Discount', icon: '🚗', desc: 'Valid for your next booked lesson', category: 'lessons' },
  { id: 'lesson_discount_20', coins: 1000, label: '20% Lesson Discount', icon: '🚗', desc: 'Valid for your next booked lesson', category: 'lessons' },
  { id: 'free_lesson', coins: 2500, label: 'Free Lesson', icon: '🎁', desc: 'One complimentary 2-hour lesson', category: 'lessons' },
  { id: 'nandos_voucher', coins: 750, label: 'Nando\'s R50 Voucher', icon: '🍗', desc: 'Redeemable at any Nando\'s SA', category: 'food' },
  { id: 'steers_voucher', coins: 500, label: 'Steers R30 Voucher', icon: '🍔', desc: 'Redeemable at Steers SA', category: 'food' },
  { id: 'fuel_voucher', coins: 1500, label: 'R100 Fuel Voucher', icon: '⛽', desc: 'BP or Shell fuel voucher', category: 'fuel' },
  { id: 'cosmetic_gold_theme', coins: 300, label: 'Gold App Theme', icon: '✨', desc: 'Exclusive gold colour scheme in-app', category: 'cosmetics' },
  { id: 'cosmetic_car_skin', coins: 200, label: 'Custom Car Skin', icon: '🎨', desc: 'Premium 3D twin skin for your vehicle', category: 'cosmetics' },
  { id: 'cosmetic_badge_frame', coins: 150, label: 'Profile Badge Frame', icon: '🖼️', desc: 'Exclusive frame around your profile badge', category: 'cosmetics' },
]

// ── Award coins ───────────────────────────────────────────────────────────────
export async function awardCoins(studentId, eventKey, customCoins = null) {
  const event = COIN_EVENTS[eventKey]
  if (!event && !customCoins) return

  const coins = customCoins || event.coins
  const label = event?.label || 'Bonus coins'
  const icon = event?.icon || '🪙'

  // Add transaction
  await supabase.from('drivecoin_transactions').insert({
    student_id: studentId,
    coins,
    label,
    icon,
    type: 'earn',
    created_at: new Date().toISOString(),
  })

  // Update balance
  const { data: current } = await supabase.from('student_xp')
    .select('drivecoin_balance').eq('student_id', studentId).single()
  const newBalance = (current?.drivecoin_balance || 0) + coins
  await supabase.from('student_xp').update({ drivecoin_balance: newBalance }).eq('student_id', studentId)

  return { coins, newBalance, label, icon }
}

// ── DriveCoins Main Component ─────────────────────────────────────────────────
export default function DriveCoinsWallet({ studentId }) {
  const [balance, setBalance] = useState(0)
  const [transactions, setTransactions] = useState([])
  const [tab, setTab] = useState('wallet') // wallet | redeem | history
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [loading, setLoading] = useState(true)
  const [redeemMsg, setRedeemMsg] = useState('')
  const [redeemError, setRedeemError] = useState('')
  const [celebrateCoins, setCelebrateCoins] = useState(null)

  useEffect(() => { loadWallet() }, [])

  const loadWallet = async () => {
    const [balRes, txRes] = await Promise.all([
      supabase.from('student_xp').select('drivecoin_balance').eq('student_id', studentId).single(),
      supabase.from('drivecoin_transactions').select('*').eq('student_id', studentId).order('created_at', { ascending: false }).limit(20),
    ])
    if (balRes.data) setBalance(balRes.data.drivecoin_balance || 0)
    if (txRes.data) setTransactions(txRes.data)
    setLoading(false)
  }

  const redeem = async (item) => {
    if (balance < item.coins) { setRedeemError('Not enough DriveCoins for this reward.'); return }
    setLoading(true); setRedeemError('')

    await supabase.from('drivecoin_transactions').insert({
      student_id: studentId, coins: -item.coins, label: `Redeemed: ${item.label}`,
      icon: item.icon, type: 'redeem', created_at: new Date().toISOString(),
    })
    const newBal = balance - item.coins
    await supabase.from('student_xp').update({ drivecoin_balance: newBal }).eq('student_id', studentId)
    setBalance(newBal)
    setRedeemMsg(`🎉 ${item.label} redeemed! Your school admin will be notified.`)
    loadWallet()
    setLoading(false)
    setTimeout(() => setRedeemMsg(''), 5000)
  }

  const categories = ['all', 'lessons', 'food', 'fuel', 'cosmetics']
  const filteredRedemptions = selectedCategory === 'all' ? REDEMPTIONS : REDEMPTIONS.filter(r => r.category === selectedCategory)

  const totalEarned = transactions.filter(t => t.type === 'earn').reduce((a, t) => a + t.coins, 0)
  const totalSpent = transactions.filter(t => t.type === 'redeem').reduce((a, t) => a + Math.abs(t.coins), 0)

  return (
    <GlassCard glow={T.yellow}>
      {/* Coin celebration */}
      {celebrateCoins && (
        <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 9999, textAlign: 'center', pointerEvents: 'none' }}>
          <div style={{ fontSize: 80, animation: 'coinBounce 0.8s ease' }}>🪙</div>
          <div style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 900, fontSize: 32, color: T.yellow }}>+{celebrateCoins}</div>
          <style>{`@keyframes coinBounce { 0%{transform:scale(0)} 60%{transform:scale(1.3)} 100%{transform:scale(1)} }`}</style>
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <div style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 900, color: T.text, fontSize: 18 }}>🪙 DriveCoins</div>
          <div style={{ fontSize: 12, color: T.textSub }}>Earn. Redeem. Flex.</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 900, fontSize: 32, color: T.yellow }}>
            {balance.toLocaleString()}
          </div>
          <div style={{ fontSize: 11, color: T.textSub }}>coins available</div>
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        <div style={{ flex: 1, background: T.green + '15', borderRadius: 10, padding: 10, textAlign: 'center' }}>
          <div style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 800, color: T.green, fontSize: 18 }}>{totalEarned.toLocaleString()}</div>
          <div style={{ fontSize: 10, color: T.textSub }}>Total earned</div>
        </div>
        <div style={{ flex: 1, background: T.orange + '15', borderRadius: 10, padding: 10, textAlign: 'center' }}>
          <div style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 800, color: T.orange, fontSize: 18 }}>{totalSpent.toLocaleString()}</div>
          <div style={{ fontSize: 10, color: T.textSub }}>Total spent</div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', background: T.bg, borderRadius: 12, padding: 4, marginBottom: 20, gap: 2 }}>
        {[{ id: 'wallet', l: '🪙 Wallet' }, { id: 'redeem', l: '🎁 Redeem' }, { id: 'history', l: '📋 History' }].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ flex: 1, padding: '8px', background: tab === t.id ? T.yellow : 'transparent', color: tab === t.id ? '#000' : T.textSub, border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer', fontSize: 12, fontFamily: "'Space Grotesk',sans-serif" }}>{t.l}</button>
        ))}
      </div>

      {/* Wallet tab — how to earn */}
      {tab === 'wallet' && (
        <div>
          <div style={{ fontWeight: 700, color: T.text, fontSize: 14, marginBottom: 12 }}>How to earn DriveCoins:</div>
          {Object.entries(COIN_EVENTS).map(([key, event]) => (
            <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: `1px solid ${T.border}` }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <span style={{ fontSize: 20 }}>{event.icon}</span>
                <span style={{ fontSize: 13, color: T.text }}>{event.label}</span>
              </div>
              <span style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 800, color: T.yellow, fontSize: 15 }}>+{event.coins}</span>
            </div>
          ))}
        </div>
      )}

      {/* Redeem tab */}
      {tab === 'redeem' && (
        <div>
          <Alert msg={redeemError} />
          <Alert msg={redeemMsg} type="success" />

          {/* Category filter */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 16, overflowX: 'auto', paddingBottom: 4 }}>
            {categories.map(cat => (
              <button key={cat} onClick={() => setSelectedCategory(cat)} style={{ background: selectedCategory === cat ? T.yellow : T.bgCard, border: `1px solid ${selectedCategory === cat ? T.yellow : T.border}`, color: selectedCategory === cat ? '#000' : T.textSub, borderRadius: 20, padding: '6px 14px', fontWeight: 700, cursor: 'pointer', fontSize: 12, fontFamily: "'Space Grotesk',sans-serif", whiteSpace: 'nowrap' }}>
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </button>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {filteredRedemptions.map(item => {
              const canAfford = balance >= item.coins
              return (
                <div key={item.id} style={{ background: T.bg, borderRadius: 14, padding: 14, border: `1px solid ${canAfford ? T.yellow + '44' : T.border}`, opacity: canAfford ? 1 : 0.6 }}>
                  <div style={{ fontSize: 32, marginBottom: 6 }}>{item.icon}</div>
                  <div style={{ fontWeight: 700, color: T.text, fontSize: 13, marginBottom: 4 }}>{item.label}</div>
                  <div style={{ fontSize: 11, color: T.textSub, marginBottom: 10, lineHeight: 1.4 }}>{item.desc}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 800, color: T.yellow, fontSize: 14 }}>🪙 {item.coins}</span>
                    <NeuBtn small color={canAfford ? T.yellow : T.border} disabled={!canAfford || loading}
                      onClick={() => redeem(item)}>
                      {canAfford ? 'Redeem' : 'Locked'}
                    </NeuBtn>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* History tab */}
      {tab === 'history' && (
        <div>
          {transactions.length === 0
            ? <div style={{ textAlign: 'center', padding: 24, color: T.textSub }}>No transactions yet. Start earning! 🪙</div>
            : transactions.map((tx, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: i < transactions.length - 1 ? `1px solid ${T.border}` : 'none' }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <span style={{ fontSize: 20 }}>{tx.icon}</span>
                  <div>
                    <div style={{ fontSize: 13, color: T.text, fontWeight: 600 }}>{tx.label}</div>
                    <div style={{ fontSize: 11, color: T.textMuted }}>{new Date(tx.created_at).toLocaleDateString('en-ZA')}</div>
                  </div>
                </div>
                <span style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 800, color: tx.type === 'earn' ? T.green : T.red, fontSize: 15 }}>
                  {tx.type === 'earn' ? '+' : ''}{tx.coins}
                </span>
              </div>
            ))
          }
        </div>
      )}
    </GlassCard>
  )
}
