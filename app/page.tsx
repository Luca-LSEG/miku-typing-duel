"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Player = { name: string; typed: string; startedAt: number | null; finishedAt: number | null };
type Phase = "setup" | "countdown" | "race" | "finished";

const sample = `빛나는 무대 위로 리듬이 흘러가
손끝에 마음을 싣고 한 글자씩 달려가
마지막 음표까지 멈추지 말고
우리의 속도로 오늘을 완성해`;

function score(typed: string, target: string, startedAt: number | null, finishedAt: number | null) {
  let correct = 0;
  for (let i = 0; i < typed.length; i++) if (typed[i] === target[i]) correct++;
  const accuracy = typed.length ? Math.round((correct / typed.length) * 100) : 100;
  const elapsed = startedAt ? Math.max(1, ((finishedAt || Date.now()) - startedAt) / 60000) : 0;
  return { correct, accuracy, cpm: elapsed ? Math.round(correct / elapsed) : 0, progress: Math.min(100, Math.round((typed.length / target.length) * 100)) };
}

function Track({ player, color, active, target, onChange }: { player: Player; color: "cyan" | "pink"; active: boolean; target: string; onChange: (v: string) => void }) {
  const input = useRef<HTMLTextAreaElement>(null);
  const stats = score(player.typed, target, player.startedAt, player.finishedAt);
  useEffect(() => { if (active) input.current?.focus(); }, [active]);
  return <section className={`player ${color}`}>
    <div className="playerHead"><span className="badge">{color === "cyan" ? "P1" : "P2"}</span><h2>{player.name}</h2><strong>{stats.progress}%</strong></div>
    <div className="meter"><i style={{ width: `${stats.progress}%` }} /></div>
    <div className="stats"><span><b>{stats.cpm}</b> 타/분</span><span><b>{stats.accuracy}%</b> 정확도</span><span><b>{stats.correct}</b> 정타</span></div>
    <textarea ref={input} aria-label={`${player.name} 입력`} value={player.typed} disabled={!active || !!player.finishedAt} onChange={e => onChange(e.target.value.slice(0, target.length))} placeholder={active ? "여기에 가사를 입력하세요…" : "카운트다운을 기다려 주세요"} spellCheck={false} />
  </section>;
}

export default function Home() {
  const [lyrics, setLyrics] = useState(sample);
  const [target, setTarget] = useState("");
  const [phase, setPhase] = useState<Phase>("setup");
  const [count, setCount] = useState(3);
  const [players, setPlayers] = useState<[Player, Player]>([{ name: "민트 스타", typed: "", startedAt: null, finishedAt: null }, { name: "핑크 비트", typed: "", startedAt: null, finishedAt: null }]);

  const cleanTarget = useMemo(() => target.replace(/\r/g, ""), [target]);
  const stats = players.map(p => score(p.typed, cleanTarget, p.startedAt, p.finishedAt));

  useEffect(() => {
    if (phase !== "countdown") return;
    if (count === 0) { const now = Date.now(); setPlayers(p => p.map(x => ({ ...x, startedAt: now })) as [Player, Player]); setPhase("race"); return; }
    const id = setTimeout(() => setCount(c => c - 1), 800); return () => clearTimeout(id);
  }, [phase, count]);

  useEffect(() => { if (phase === "race" && players.every(p => p.finishedAt)) setPhase("finished"); }, [players, phase]);

  const start = () => { const t = lyrics.replace(/\r/g, "").trim(); if (!t) return; setTarget(t); setPlayers(p => p.map(x => ({ ...x, typed: "", startedAt: null, finishedAt: null })) as [Player, Player]); setCount(3); setPhase("countdown"); };
  const type = (index: number, value: string) => setPlayers(prev => {
    const next = [...prev] as [Player, Player];
    const done = value === cleanTarget;
    next[index] = { ...next[index], typed: value, finishedAt: done ? Date.now() : null };
    return next;
  });
  const reset = () => { setPhase("setup"); setTarget(""); };
  const winner = phase === "finished" ? (players[0].finishedAt! <= players[1].finishedAt! ? 0 : 1) : stats[0].progress === stats[1].progress ? -1 : stats[0].progress > stats[1].progress ? 0 : 1;

  return <main>
    <header><div className="brand"><span className="note">♪</span><div><b>MIKU TYPE</b><small>SONG DISAPPEARANCE DUEL</small></div></div><div className="live"><i /> 1 VS 1 LOCAL BATTLE</div></header>
    {phase === "setup" ? <div className="setup">
      <div className="kicker">READY YOUR FINGERS</div><h1>노래가 끝나기 전에<br/><em>먼저 완주하라</em></h1><p>같은 키보드 두 개로 펼치는 로컬 타자 배틀.<br/>보유한 한국어 가사를 붙여 넣고 대결을 시작하세요.</p>
      <label className="lyricsBox"><span>대결할 가사 <b>{lyrics.length}자</b></span><textarea value={lyrics} onChange={e => setLyrics(e.target.value)} placeholder="한국어 가사를 붙여 넣으세요" /></label>
      <div className="names"><label>P1 닉네임<input value={players[0].name} onChange={e => setPlayers(p => [{...p[0], name:e.target.value}, p[1]])}/></label><span>VS</span><label>P2 닉네임<input value={players[1].name} onChange={e => setPlayers(p => [p[0], {...p[1], name:e.target.value}])}/></label></div>
      <button className="start" onClick={start}>BATTLE START <span>↗</span></button><small className="hint">가사는 이 브라우저 밖으로 전송되거나 저장되지 않습니다.</small>
    </div> : <div className="arena">
      <div className="target"><div className="targetTop"><span>♪ NOW TYPING</span><button onClick={reset}>나가기 ×</button></div><p>{cleanTarget.split("").map((ch,i) => <span key={i} className={i < Math.max(players[0].typed.length,players[1].typed.length) ? "passed" : ""}>{ch}</span>)}</p></div>
      <div className="tracks"><Track player={players[0]} color="cyan" active={phase === "race"} target={cleanTarget} onChange={v=>type(0,v)}/><div className="versus">VS</div><Track player={players[1]} color="pink" active={phase === "race"} target={cleanTarget} onChange={v=>type(1,v)}/></div>
      {phase === "finished" && <div className="result"><span>WINNER</span><h2>{players[winner].name}</h2><p>완벽한 리듬으로 먼저 결승선을 통과했습니다!</p><button onClick={start}>다시 대결</button><button className="ghost" onClick={reset}>가사 바꾸기</button></div>}
      {phase === "countdown" && <div className="countdown"><small>GET READY</small><b>{count || "GO!"}</b></div>}
    </div>}
    <footer><span>ⓘ 두 개의 입력창을 각각 클릭해 대결하세요</span><span>MIKU TYPE // 2026</span></footer>
  </main>;
}
