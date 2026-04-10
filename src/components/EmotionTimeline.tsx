import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export interface EmotionPoint {
  timestamp_sec: number;
  dominant_emotion: string;
  emotions: Record<string, number>;
}

export const EMOTION_COLORS: Record<string, string> = {
  happy:   '#10b981', // Emerald
  neutral: '#475569', // Slate
  sad:     '#818cf8', // Indigo
  angry:   '#f43f5e', // Rose
  surprise:'#00e5ff', // Cyan
  fear:    '#fb923c', // Orange
  disgust: '#a78bfa', // Purple
};

export const EMOTION_KEYS = ['happy', 'surprise', 'neutral', 'sad', 'angry', 'fear', 'disgust'];

interface EmotionTimelineProps {
  timeline: EmotionPoint[];
}

export default function EmotionTimeline({ timeline }: EmotionTimelineProps) {
  if (!timeline || !timeline.length) return null;

  const { chartData, domCounts, overallDom } = useMemo(() => {
    const buckets: Record<number, Record<string, number>> = {};
    timeline.forEach(pt => {
      const bucket = Math.floor(pt.timestamp_sec / 10) * 10;
      if (!buckets[bucket]) buckets[bucket] = {};
      Object.entries(pt.emotions || {}).forEach(([emotion, score]) => {
        buckets[bucket][emotion] = (buckets[bucket][emotion] || 0) + score;
      });
    });

    const chartData = Object.entries(buckets)
      .sort(([a], [b]) => Number(a) - Number(b))
      .map(([sec, emotions]) => {
        const total = Object.values(emotions).reduce((s, v) => s + v, 0) || 1;
        const row: Record<string, any> = { time: `${sec}s` };
        EMOTION_KEYS.forEach(k => {
          row[k] = parseFloat((((emotions[k] || 0) / total) * 100).toFixed(1));
        });
        return row;
      });

    const domCounts: Record<string, number> = {};
    timeline.forEach(pt => {
      if (pt.dominant_emotion) {
        domCounts[pt.dominant_emotion] = (domCounts[pt.dominant_emotion] || 0) + 1;
      }
    });
    
    // Fallback if no counts
    const sortedDoms = Object.entries(domCounts).sort(([,a],[,b]) => b - a);
    const overallDom = sortedDoms[0]?.[0] || 'neutral';

    return { chartData, domCounts, overallDom };
  }, [timeline]);

  const glass = 'bg-card/50 backdrop-blur-xl border border-border/50 shadow-lg';

  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className={`${glass} rounded-3xl p-8`}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-2xl font-display font-bold text-foreground mb-1">Emotion Dynamics</h3>
          <p className="text-sm text-muted-foreground">AI Facial analysis across your session.</p>
        </div>
        <div className="flex items-center gap-2.5">
          <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Overall:</span>
          <span
            className="font-bold uppercase tracking-widest px-3 py-1 rounded-md text-zinc-900 text-xs shadow-lg"
            style={{ background: EMOTION_COLORS[overallDom] ?? '#475569', boxShadow: `0 0 15px ${EMOTION_COLORS[overallDom]}40` }}
          >
            {overallDom}
          </span>
        </div>
      </div>
      
      <div className="h-[280px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} barCategoryGap="15%" margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
            <XAxis dataKey="time" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={{ stroke: '#334155' }} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
            <Tooltip
              cursor={{ fill: 'rgba(255,255,255,0.05)' }}
              contentStyle={{ background: 'rgba(15,23,42,0.9)', border: '1px solid #334155', borderRadius: '12px', fontSize: '13px', color: '#fff', boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }}
              itemStyle={{ textTransform: 'capitalize', fontWeight: '600' }}
              formatter={(val: number) => [`${val}%`]}
            />
            <Legend
              wrapperStyle={{ fontSize: 12, paddingTop: 15, fontWeight: '500' }}
              formatter={(val) => <span style={{ textTransform: 'capitalize', color: '#94a3b8' }}>{val}</span>}
              iconType="circle"
            />
            {EMOTION_KEYS.map((key, i) => (
              <Bar key={key} dataKey={key} stackId="a" fill={EMOTION_COLORS[key]} 
                radius={i === EMOTION_KEYS.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]} 
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="flex flex-wrap gap-2 mt-6 p-4 rounded-2xl bg-background/40 border border-border/50">
        <span className="text-xs font-bold uppercase text-muted-foreground mr-2 shrink-0 py-1.5 tracking-wider">Frames captured:</span>
        {Object.entries(domCounts)
          .sort(([,a],[,b]) => b - a)
          .slice(0, 5)
          .map(([emotion, count]) => (
            <div
              key={emotion}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold tracking-widest text-zinc-900 uppercase"
              style={{ background: EMOTION_COLORS[emotion] ?? '#475569' }}
            >
              <span>{emotion}</span> <span className="opacity-60 text-black">|</span> <span>{count}</span>
            </div>
          ))}
      </div>
    </motion.div>
  );
}
