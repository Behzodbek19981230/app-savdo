import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const data = [
  { month: "Yan", revenue: 4000, expenses: 2400 },
  { month: "Fev", revenue: 3000, expenses: 1398 },
  { month: "Mar", revenue: 5000, expenses: 3800 },
  { month: "Apr", revenue: 4780, expenses: 3908 },
  { month: "May", revenue: 5890, expenses: 4800 },
  { month: "Iyn", revenue: 6390, expenses: 3800 },
  { month: "Iyl", revenue: 7490, expenses: 4300 },
];

export function RevenueChart() {
  return (
    <div className="rounded-xl lg:rounded-2xl border border-border bg-card p-4 lg:p-5 shadow-sm">
      <h3 className="text-base lg:text-lg font-bold text-foreground mb-4">Daromad statistikasi</h3>
      <div className="w-full" style={{ height: '240px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
            <defs>
              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(221, 83%, 53%)" stopOpacity={0.12}/>
                <stop offset="95%" stopColor="hsl(221, 83%, 53%)" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0.10}/>
                <stop offset="95%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid 
              strokeDasharray="0" 
              stroke="hsl(var(--border))"
              strokeOpacity={0.5}
              vertical={false}
            />
            <XAxis 
              dataKey="month" 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
              tickFormatter={(value) => `$${value / 1000}k`}
              width={45}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '12px',
                fontSize: '12px',
                padding: '8px 12px',
                boxShadow: '0 6px 18px rgba(15, 23, 42, 0.06)'
              }}
              formatter={(value: number) => [`$${value.toLocaleString()}`, '']}
            />
            <Area 
              type="monotone" 
              dataKey="revenue" 
              stroke="hsl(221, 83%, 53%)" 
              strokeWidth={2}
              fillOpacity={1} 
              fill="url(#colorRevenue)" 
              name="Daromad"
            />
            <Area 
              type="monotone" 
              dataKey="expenses" 
              stroke="hsl(142, 76%, 36%)" 
              strokeWidth={2}
              fillOpacity={1} 
              fill="url(#colorExpenses)" 
              name="Xarajat"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
