import React, { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  TrendingUp, TrendingDown, ShoppingBag, Package, Users, Euro,
  Download, AlertTriangle, CreditCard, Percent, BarChart3,
} from 'lucide-react'
import { useStore } from '../../context/StoreContext'
import { useAuth } from '../../context/AuthContext'
import {
  exportOrdersCsv, ORDER_STATUS_LABEL, ORDER_STATUS_COLOR, sortOrdersByDate,
} from '../../lib/admin'
import { computeStoreStats, STATS_PERIODS, filterOrdersInRange } from '../../lib/stats'
import './AdminStats.css'

function formatMoney(n) {
  return n.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 2 })
}

function StatCard({ label, value, sub, icon: Icon, trend, color = 'var(--accent)', showTrend = true }) {
  return (
    <div className="stat-card" style={{ '--card-color': color }}>
      <div className="stat-card-top">
        <div className="stat-card-icon"><Icon size={20}/></div>
        {showTrend && trend !== undefined && trend !== null && (
          <div className={`stat-trend-badge ${trend >= 0 ? 'up' : 'down'}`}>
            {trend >= 0 ? <TrendingUp size={12}/> : <TrendingDown size={12}/>}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <p className="stat-card-value">{value}</p>
      <p className="stat-card-label">{label}</p>
      {sub && <p className="stat-card-sub">{sub}</p>}
    </div>
  )
}

function MiniBar({ label, value, max, color }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0
  return (
    <div className="mini-bar-row">
      <span className="mini-bar-label">{label}</span>
      <div className="mini-bar-track">
        <div className="mini-bar-fill" style={{ width: `${pct}%`, background: color }}/>
      </div>
      <span className="mini-bar-val">{value}</span>
    </div>
  )
}

export default function AdminStats() {
  const { orders, products, categories } = useStore()
  const { userCan } = useAuth()
  const [period, setPeriod] = useState('30d')

  const sortedOrders = useMemo(() => sortOrdersByDate(orders), [orders])
  const stats = useMemo(
    () => computeStoreStats(sortedOrders, products, categories, period),
    [sortedOrders, products, categories, period],
  )

  const periodOrders = useMemo(
    () => filterOrdersInRange(sortedOrders, stats.range.from, stats.range.to),
    [sortedOrders, stats.range],
  )

  const maxMonthlyRev = Math.max(...stats.monthly.map(m => m.revenue), 1)
  const maxMonthlyOrd = Math.max(...stats.monthly.map(m => m.orders), 1)
  const maxTopProduct = stats.topByUnits[0]?.qty || 1
  const maxCategory = stats.topCategories[0]?.qty || 1
  const statusTotal = Object.values(stats.statusCount).reduce((a, b) => a + b, 0)

  return (
    <div className="stats-page">
      <div className="page-header stats-page-header">
        <div>
          <h1 className="page-title">Estadísticas</h1>
          <p className="page-sub">
            Rendimiento en {stats.range.label.toLowerCase()}
            {stats.hasComparison && ' · comparado con el periodo anterior'}
          </p>
        </div>
        <div className="stats-header-actions">
          <div className="stats-period-tabs">
            {STATS_PERIODS.map(p => (
              <button
                key={p.key}
                type="button"
                className={period === p.key ? 'active' : ''}
                onClick={() => setPeriod(p.key)}
              >
                {p.label}
              </button>
            ))}
          </div>
          {userCan('estadisticas.export') && periodOrders.length > 0 && (
            <button className="btn-add" onClick={() => exportOrdersCsv(periodOrders)}>
              <Download size={16}/> Exportar CSV
            </button>
          )}
        </div>
      </div>

      <div className="stats-kpi-grid">
        <StatCard
          label="Ingresos"
          value={`${formatMoney(stats.revenue)} €`}
          sub={`${stats.range.label}`}
          icon={Euro}
          trend={stats.hasComparison ? stats.revenueTrend : null}
          color="#c8502a"
          showTrend={stats.hasComparison}
        />
        <StatCard
          label="Pedidos"
          value={stats.orderCount}
          sub={`${stats.validOrderCount} completados`}
          icon={ShoppingBag}
          trend={stats.hasComparison ? stats.ordersTrend : null}
          color="#2a7a4a"
          showTrend={stats.hasComparison}
        />
        <StatCard
          label="Ticket medio"
          value={stats.avgTicket > 0 ? `${formatMoney(stats.avgTicket)} €` : '—'}
          icon={BarChart3}
          color="#5a52c8"
          showTrend={false}
        />
        <StatCard
          label="Clientes únicos"
          value={stats.uniqueCustomers}
          sub="Con email o cuenta"
          icon={Users}
          color="#0891b2"
          showTrend={false}
        />
        <StatCard
          label="Tasa cancelación"
          value={`${stats.cancelRate}%`}
          icon={Percent}
          color="#dc2626"
          showTrend={false}
        />
        <StatCard
          label="Pagos reales"
          value={stats.realPayments}
          sub={stats.simulated > 0 ? `${stats.simulated} simulados` : 'Sin simulaciones'}
          icon={CreditCard}
          color="#7c3aed"
          showTrend={false}
        />
      </div>

      <div className="stats-cols stats-cols-3">
        <div className="stats-panel stats-panel-wide">
          <div className="stats-panel-head">
            <h2><Euro size={16}/> Ingresos y pedidos</h2>
            <span className="stats-panel-hint">Últimos {stats.monthly.length} meses</span>
          </div>
          {stats.monthly.every(m => m.revenue === 0 && m.orders === 0) ? (
            <p className="stats-empty">Sin datos en este rango</p>
          ) : (
            <div className="combo-chart">
              {stats.monthly.map((m, i) => (
                <div key={i} className="combo-col">
                  <div className="combo-bars">
                    <span className="combo-rev-label">{m.revenue > 0 ? `${m.revenue.toFixed(0)}€` : ''}</span>
                    <div
                      className="combo-bar revenue"
                      style={{ height: `${(m.revenue / maxMonthlyRev) * 100}%` }}
                      title={`${m.revenue.toFixed(2)} €`}
                    />
                    <div
                      className="combo-bar orders"
                      style={{ height: `${(m.orders / maxMonthlyOrd) * 60}%` }}
                      title={`${m.orders} pedidos`}
                    />
                  </div>
                  <span className="combo-label">{m.shortLabel}</span>
                  <span className="combo-orders-count">{m.orders} ped.</span>
                </div>
              ))}
            </div>
          )}
          <div className="combo-legend">
            <span><i className="legend-dot revenue"/> Ingresos</span>
            <span><i className="legend-dot orders"/> Pedidos</span>
          </div>
        </div>

        <div className="stats-panel">
          <h2>Estado de pedidos</h2>
          {statusTotal === 0 && <p className="stats-empty">Sin pedidos en el periodo</p>}
          {Object.entries(stats.statusCount).map(([status, count]) => (
            count > 0 && (
              <MiniBar
                key={status}
                label={ORDER_STATUS_LABEL[status] || status}
                value={count}
                max={statusTotal}
                color={ORDER_STATUS_COLOR[status] || 'var(--muted)'}
              />
            )
          ))}
        </div>
      </div>

      <div className="stats-cols">
        <div className="stats-panel">
          <div className="stats-panel-head">
            <h2><Package size={16}/> Más vendidos</h2>
            <Link to="/admin/productos" className="stats-link">Productos →</Link>
          </div>
          {stats.topByUnits.length === 0 && <p className="stats-empty">Sin ventas en el periodo</p>}
          {stats.topByUnits.map(({ product, qty, revenue }) => (
            <div key={product.id} className="top-product-row">
              <img src={product.image} alt={product.name}/>
              <div className="top-product-info">
                <p className="top-product-name">{product.name}</p>
                <div className="top-product-bar">
                  <div className="top-product-fill" style={{ width: `${(qty / maxTopProduct) * 100}%` }}/>
                </div>
                <span className="top-product-rev">{revenue.toFixed(2)} €</span>
              </div>
              <span className="top-product-qty">{qty} ud.</span>
            </div>
          ))}
        </div>

        <div className="stats-panel">
          <div className="stats-panel-head">
            <h2><Users size={16}/> Mejores clientes</h2>
            <Link to="/admin/clientes" className="stats-link">Clientes →</Link>
          </div>
          {stats.topCustomers.length === 0 && (
            <p className="stats-empty">Sin clientes identificados (falta email en pedidos)</p>
          )}
          {stats.topCustomers.map((c, i) => (
            <div key={i} className="top-customer-row">
              <span className="top-customer-rank">#{i + 1}</span>
              <div className="top-customer-info">
                <p>{c.email}</p>
                <span>{c.orders} pedido{c.orders !== 1 ? 's' : ''}</span>
              </div>
              <strong>{c.spent.toFixed(2)} €</strong>
            </div>
          ))}
        </div>
      </div>

      <div className="stats-cols">
        <div className="stats-panel">
          <h2>Ventas por categoría</h2>
          {stats.topCategories.length === 0 && <p className="stats-empty">Sin datos</p>}
          {stats.topCategories.map(({ category, qty }) => (
            <MiniBar
              key={category.id}
              label={category.name}
              value={qty}
              max={maxCategory}
              color="var(--accent)"
            />
          ))}
        </div>

        {stats.lowStock.length > 0 && (
          <div className="stats-panel stats-alert">
            <div className="stats-panel-head">
              <h2><AlertTriangle size={16}/> Stock bajo</h2>
              <Link to="/admin/productos" className="stats-link">Gestionar →</Link>
            </div>
            <div className="low-stock-list">
              {stats.lowStock.slice(0, 6).map(p => (
                <div key={p.id} className="low-stock-row">
                  <img src={p.image} alt={p.name}/>
                  <span className="low-stock-name">{p.name}</span>
                  <span className={`low-stock-qty ${p.stock === 0 ? 'zero' : ''}`}>
                    {p.stock === 0 ? 'Agotado' : `${p.stock} ud.`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
