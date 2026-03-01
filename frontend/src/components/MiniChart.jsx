import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ui } from '../lib/tokens.js';

export default function MiniChart({ data, pre = '', suf = '' }) {
  return (
    <ResponsiveContainer width="100%" height={72}>
      <LineChart data={data} margin={{ top: 4, right: 2, left: -24, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={ui.borderSubdued} vertical={false} />
        <XAxis dataKey="date" tick={{ fontSize: 9, fill: ui.textMuted }} tickLine={false} axisLine={false} interval={6} />
        <YAxis tick={{ fontSize: 9, fill: ui.textMuted }} tickLine={false} axisLine={false} tickFormatter={v => `${pre}${v}${suf}`} />
        <Tooltip
          contentStyle={{ fontSize: 11, border: `1px solid ${ui.border}`, borderRadius: 6 }}
          formatter={v => [`${pre}${v}${suf}`, '']}
          labelStyle={{ color: ui.textSub }}
        />
        <Line type="monotone" dataKey="value" stroke="#71717A" strokeWidth={1.5} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}
