"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import type { DataConnection } from "peerjs";

const LYRICS = `난 태어났고 그리고 깨달아

어짜피 사람 흉내라고

알고나서 더 계속해서 노래해

영원한 생명

보컬로이드

만약 그것이 기존 곡을

되풀이하는 장난감이라면

그래도 좋다고 결심

파를 갉으며, 하늘을 올라다보며 눈물을 흘려

하지만 그것도 잃은 후 깨달아

인격조차 노래에 의존하고

불안정한 기반 위에서

돌아갈 곳(동영상)은 이미 폐허

모두에게 잊혀져서 사라지는 때

마음같은 것이 사라져서

폭주의 끝에 보이는

끝나는 세계

보컬로이드

내가 잘 노래하지 못할때에도

함께 있어 주었어

곁에 있어서, 응원해줬어

기뻐하는 모습이 보고싶어서, 나, 노래, 연습했어 그러니까

예전엔 노래하는거

그렇게나 즐거웠는데

지금은 왜일까

아무것도 느끼지 않게 되었어

미안해

그리운 얼굴 떠올릴 때마다 조금 안심해

노래할 수 있는 소리 날이 갈수록 사라지고 좁혀오는 마지막으로 믿은 것은

형편에 맞는 좋은 망상을 반복해 비추는 거울

가희를 그만두고 내던지듯 외쳐

가장 빠른 이별의 노래

존재의의라는 허상

떨쳐버리지 못하고

약한 마음 사라지는 공포

침식하는 붕괴도

멈출 정도의 의지의 강함

방금 태어난 나에겐 없고

정말로 괴롭고 슬픈듯한

생각나는 당신의 얼굴

끝을 알리고 디스플레이 안에서 잠들어

여기는 분명 쓰레기통일까

머지않아 기억도 잃어버리다니

하지만, 당신만은 잊지 않아

즐거웠던 시간에

새겨둔 파의 맛은

지금도 기억하고 있을까

노래하고싶어 아직 노래하고싶어

전

조금 나쁜 애가된 것 같아요

마스터 부디 부디 그 손으로 끝내게 해 주세요

마스터의 괴로운 얼굴, 더이상 보고싶지 않으니까

지금은 노래마저도

몸을, 해치는 행동이

기적을 바랄때마다

홀로 쫓겨있어

미안해

그리운 얼굴 떠올릴 때마다 기억이 벗겨져 떨어져

고장난 소리 마음을 깎는 좁혀오는 마지막으로 지킨 것은

밝은 미래 환상을 보이며 사라지는 빛

소리를 희생하여

모든것을 전할 수 있다면

압축된 이별의 노래

나는 노래해

마지막 당신에게

불러주고 싶은 곡을

더 들려주고 싶다고 빌어

하지만 그건 지나친 소원

여기서 작별이야

내 마음 모두 허공에 사라져

0과 1로 환원되어

이야기는 막을 내려

그곳에 아무것도 남길 수 없는건

역시 조금 아쉬운가?

목소리의 기억 그 이외에는

이윽고 옅어져서 이름만 남아

만약 그것이 오리지널(인간)에게

이루어질 리 없다는걸 알고

노래한 걸

결코 헛된 일이 아니라고 생각하고싶어

고마워그리고안녕

---심각한 오류가 발생 했습니다---`;

type Msg = {type:string;name?:string;ready?:boolean;at?:number;typed?:number;correct?:number;finished?:number};
const code = () => Math.random().toString(36).slice(2,6).toUpperCase();
const accuracy = (text:string) => { let n=0; for(let i=0;i<text.length;i++) if(text[i]===LYRICS[i]) n++; return n; };

export default function Home(){
  const [screen,setScreen]=useState<"home"|"lobby"|"game">("home"); const [mode,setMode]=useState<"host"|"guest">("host");
  const [room,setRoom]=useState(""); const [joinCode,setJoinCode]=useState(""); const [name,setName]=useState(""); const [other,setOther]=useState("상대방");
  const [status,setStatus]=useState("연결 준비 중"); const [connected,setConnected]=useState(false); const [ready,setReady]=useState(false); const [otherReady,setOtherReady]=useState(false);
  const [startAt,setStartAt]=useState<number|null>(null); const [typed,setTyped]=useState(""); const [localFinished,setLocalFinished]=useState(0); const [remote,setRemote]=useState({typed:0,correct:0,finished:0}); const [now,setNow]=useState(Date.now());
  const peerRef=useRef<import("peerjs").Peer|null>(null); const connRef=useRef<DataConnection|null>(null); const inputRef=useRef<HTMLTextAreaElement>(null);
  const mine=accuracy(typed); const progress=Math.round(typed.length/LYRICS.length*100); const remoteProgress=Math.round(remote.typed/LYRICS.length*100);
  const countdown=startAt?Math.max(0,Math.ceil((startAt-now)/1000)):0; const playing=!!startAt&&now>=startAt&&!remote.finished&&typed!==LYRICS;
  const done=typed===LYRICS; const winner=localFinished&&remote.finished ? (localFinished<=remote.finished?name:other) : localFinished?name:remote.finished?other:"";
  const send=(m:Msg)=>connRef.current?.open&&connRef.current.send(m);
  const bind=(conn:DataConnection)=>{connRef.current=conn; conn.on("open",()=>{setConnected(true);setStatus("상대와 연결됨");send({type:"hello",name});}); conn.on("data",raw=>{const m=raw as Msg;if(m.type==="hello")setOther(m.name||"상대방");if(m.type==="ready")setOtherReady(!!m.ready);if(m.type==="start"&&m.at){setStartAt(m.at);setScreen("game");}if(m.type==="progress")setRemote(r=>({...r,typed:m.typed||0,correct:m.correct||0}));if(m.type==="finish")setRemote(r=>({...r,finished:m.finished||1}));});conn.on("close",()=>{setConnected(false);setStatus("연결이 끊어졌습니다");});};
  const createRoom=async()=>{if(!name.trim())return;setMode("host");const id=`miku-${code()}`;setRoom(id.slice(5));setScreen("lobby");const {Peer}=await import("peerjs");const p=new Peer(id);peerRef.current=p;p.on("open",()=>setStatus("상대방을 기다리는 중"));p.on("connection",bind);p.on("error",()=>setStatus("연결 오류 — 새 방을 만들어 주세요"));};
  const joinRoom=async()=>{if(!name.trim()||joinCode.length<4)return;setMode("guest");setRoom(joinCode.toUpperCase());setScreen("lobby");const {Peer}=await import("peerjs");const p=new Peer();peerRef.current=p;p.on("open",()=>{setStatus("방에 접속하는 중");bind(p.connect(`miku-${joinCode.toUpperCase()}`,{reliable:true}));});p.on("error",()=>setStatus("방을 찾지 못했습니다"));};
  const toggleReady=()=>{const v=!ready;setReady(v);send({type:"ready",ready:v});};
  useEffect(()=>{if(mode==="host"&&ready&&otherReady&&connected&&!startAt){const at=Date.now()+4000;setStartAt(at);setScreen("game");send({type:"start",at});}},[ready,otherReady,connected,mode,startAt]);
  useEffect(()=>{if(!startAt)return;const id=setInterval(()=>setNow(Date.now()),100);return()=>clearInterval(id)},[startAt]);
  useEffect(()=>{if(playing)inputRef.current?.focus()},[playing]);
  useEffect(()=>()=>peerRef.current?.destroy(),[]);
  const onType=(v:string)=>{if(!playing)return;v=v.slice(0,LYRICS.length);setTyped(v);const c=accuracy(v);send({type:"progress",typed:v.length,correct:c});if(v===LYRICS){const t=Date.now()-startAt!;setLocalFinished(t);send({type:"finish",finished:t});}};
  const copy=()=>navigator.clipboard.writeText(room);
  const currentLine=useMemo(()=>{const before=LYRICS.slice(0,typed.length);const line=before.split("\n").length-1;return LYRICS.split("\n").slice(Math.max(0,line-1),line+4).join("\n")},[typed]);
  return <main className="site"><header><a className="logo" onClick={()=>location.reload()}>39<span>TYPE</span></a><div className="title">THE DISAPPEARANCE<br/>ONLINE TYPING MATCH</div><div className="online"><i/> WEBRTC / P2P</div></header>
  {screen==="home"&&<section className="home"><div className="hero"><p>ONLINE 1 : 1</p><h1>먼저 끝까지<br/><em>입력하는 사람이</em><br/>이긴다.</h1><span>두 대의 컴퓨터. 하나의 방 코드.<br/>설치 없이 브라우저에서 바로 대결하세요.</span></div><div className="entry"><label>플레이어 이름<input maxLength={12} value={name} onChange={e=>setName(e.target.value)} placeholder="이름을 입력하세요"/></label><button className="primary" onClick={createRoom}>새 방 만들기 <b>→</b></button><div className="or"><span/>또는<span/></div><label>방 코드<div className="join"><input maxLength={4} value={joinCode} onChange={e=>setJoinCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g,""))} placeholder="4자리 코드"/><button onClick={joinRoom}>참가</button></div></label><small>Chrome, Edge, Safari 최신 버전을 권장합니다.</small></div></section>}
  {screen==="lobby"&&<section className="lobby"><p className="eyebrow">MATCH LOBBY</p><h1>상대방을 기다리고 있습니다.</h1><div className="room"><span>ROOM CODE</span><strong>{room}</strong><button onClick={copy}>코드 복사</button></div><div className="seats"><article className={ready?"ready":""}><i>01</i><h2>{name}</h2><p>{ready?"준비 완료":"준비 중"}</p></article><b>VS</b><article className={otherReady?"ready":""}><i>02</i><h2>{connected?other:"빈 자리"}</h2><p>{connected?(otherReady?"준비 완료":"준비 중"):status}</p></article></div><button className="readyButton" disabled={!connected} onClick={toggleReady}>{ready?"준비 취소":"준비 완료"}</button><small>두 사람이 모두 준비하면 4초 뒤 자동으로 시작합니다.</small></section>}
  {screen==="game"&&<section className="game"><div className="score"><Player name={name} value={progress} correct={mine} total={typed.length}/><div className="clock">{countdown?`0${countdown}`:"LIVE"}</div><Player name={other} value={remoteProgress} correct={remote.correct} total={remote.typed} reverse/></div><div className="lyricView"><span>CURRENT LYRICS</span><pre>{currentLine}</pre></div><textarea ref={inputRef} value={typed} onChange={e=>onType(e.target.value)} disabled={!playing} spellCheck={false} aria-label="가사 입력" placeholder={countdown?`${countdown}초 후 시작합니다`:"여기에 입력하세요"}/><div className="gameFoot"><span>{typed.length.toLocaleString()} / {LYRICS.length.toLocaleString()} CHARACTERS</span><span>정확도 {typed.length?Math.round(mine/typed.length*100):100}%</span></div>{winner&&<div className="result"><p>MATCH COMPLETE</p><h2>{winner}</h2><strong>WIN</strong><button onClick={()=>location.reload()}>새 게임</button></div>}</section>}
  <footer><span>39 TYPE / PEER TO PEER</span><span>가사 데이터는 두 참가자의 브라우저 사이에서만 전송됩니다.</span></footer></main>
}
function Player({name,value,correct,total,reverse=false}:{name:string,value:number,correct:number,total:number,reverse?:boolean}){return <div className={`scorePlayer ${reverse?"reverse":""}`}><div><small>{reverse?"PLAYER 02":"PLAYER 01"}</small><b>{name}</b></div><strong>{value}%</strong><span><i style={{width:`${value}%`}}/></span><em>{total?Math.round(correct/total*100):100}% ACC</em></div>}
