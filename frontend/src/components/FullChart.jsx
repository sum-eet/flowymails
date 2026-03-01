import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Card from './Card.jsx';
import { ui } from '../lib/tokens.js';

export default function FullChart({ data, title, subtitle, value, pre = '', suf = '' }) {
  return (
    <Card>
      <div style={{ padding: 20 }}>
        <div style={{ fontSize: 13, color: ui.textSub, marginBottom: 3, fontFamily: "'JustSans', system-ui" }}>{title}</div>
        <div style={{ fontSize: 11, color: ui.textMuted, marginBottom: 10, fontFamily: "'JustSans', system-ui" }}>{subtitle}</div>
        <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-1px', color: ui.text, marginBottom: 14, fontFamily: "'JustSans', system-ui" }}>{value}</div>
        <ResponsiveContainer width="100%" height={130}>
          <LineChart data={data} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={ui.borderSubdued} vertical={false} />
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: ui.textMuted }} tickLine={false} axisLine={false} interval={6} />
            <YAxis tick={{ fontSize: 10, fill: ui.textMuted }} tickLine={false} axisLine={false} tickFormatter={v => `${pre}${v}${suf}`} />
            <Tooltip
              contentStyle={{ fontSize: 11, border: `1px solid ${ui.border}`, borderRadius: 6 }}
              formatter={v => [`${pre}${v}${suf}`, '']}
            />
            <Line type="monotone" dataKey="value" stroke="#3F3F46" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
