import { useState, useEffect } from "react";
import { supabase } from "./supabase.js";

const C = {
  orange:"#FF6B2C",teal:"#00C9C8",tealDark:"#00A8A8",purple:"#7C3AED",
  navy:"#1E2A4A",bg:"#F4F6FA",card:"#FFFFFF",border:"#E5E9F2",
  textMuted:"#8A94A6",green:"#22C55E",red:"#EF4444",yellow:"#F59E0B",
};

const Btn=({color=C.teal,outline,onClick,children,full,small,danger,disabled})=>(
  <button onClick={onClick} disabled={disabled} style={{background:disabled?C.border:danger?C.red:outline?"transparent":color,color:disabled?C.textMuted:outline?(danger?C.red:color):"#fff",border:`2px solid ${disabled?C.border:danger?C.red:color}`,borderRadius:10,padding:small?"6px 14px":"11px 22px",fontWeight:700,fontSize:small?13:15,cursor:disabled?"not-allowed":"pointer",width:full?"100%":undefined}}>{children}</button>
);
const Card=({children,style})=>(<div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:16,padding:20,...style}}>{children}</div>);
const Input=({label,value,onChange,placeholder,type="text",required})=>(
  <div style={{marginBottom:18}}>
    {label&&<label style={{display:"block",fontWeight:700,color:C.navy,marginBottom:6,fontSize:14}}>{label}{required&&<span style={{color:C.red}}> *</span>}</label>}
    <input value={value} onChange={onChange} placeholder={placeholder} type={type} style={{width:"100%",border:`1.5px solid ${C.border}`,borderRadius:10,padding:"13px 14px",fontSize:15,boxSizing:"border-box",outline:"none",fontFamily:"inherit"}}/>
  </div>
);
const EmptyState=({icon="🚗",title,subtitle})=>(
  <Card style={{textAlign:"center",padding:48}}>
    <div style={{fontSize:36,background:C.teal+"22",borderRadius:16,width:72,height:72,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px"}}>{icon}</div>
    <div style={{fontWeight:700,color:C.navy,fontSize:17}}>{title}</div>
    <div style={{color:C.textMuted,marginTop:6,fontSize:14}}>{subtitle}</div>
  </Card>
);
const Alert=({msg,type="error"})=>msg?(<div style={{background:type==="error"?C.red+"15":C.green+"15",border:`1px solid ${type==="error"?C.red:C.green}44`,borderRadius:10,padding:"12px 16px",color:type==="error"?C.red:C.green,fontSize:14,marginBottom:16}}>{msg}</div>):null;
const BottomNav=({tabs,active,setActive})=>(
  <div style={{position:"fixed",bottom:0,left:0,right:0,background:"#fff",borderTop:`1px solid ${C.border}`,display:"flex",zIndex:100,maxWidth:480,margin:"0 auto"}}>
    {tabs.map(t=>(
      <button key={t.id} onClick={()=>setActive(t.id)} style={{flex:1,padding:"10px 4px 6px",background:"none",border:"none",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:3,color:active===t.id?C.teal:C.textMuted,fontWeight:active===t.id?700:400,fontSize:11}}>
        <span style={{fontSize:20}}>{t.icon}</span>{t.label}
      </button>
    ))}
  </div>
);

// AUTH
const AuthScreen=()=>{
  const[mode,setMode]=useState("login");
  const[email,setEmail]=useState("");const[password,setPassword]=useState("");
  const[fullName,setFullName]=useState("");const[role,setRole]=useState("student");
  const[phone,setPhone]=useState("");const[otp,setOtp]=useState("");const[otpSent,setOtpSent]=useState(false);
  const[loading,setLoading]=useState(false);const[error,setError]=useState("");const[success,setSuccess]=useState("");

  const login=async()=>{setLoading(true);setError("");const{error}=await supabase.auth.signInWithPassword({email,password});if(error)setError(error.message);setLoading(false);};
  const signup=async()=>{if(!fullName||!email||!password){setError("Fill all required fields.");return;}setLoading(true);setError("");const{error}=await supabase.auth.signUp({email,password,options:{data:{full_name:fullName,role}}});if(error)setError(error.message);else setSuccess("Account created! Check your email to confirm.");setLoading(false);};
  const google=async()=>{await supabase.auth.signInWithOAuth({provider:"google",options:{redirectTo:window.location.origin}});};
  const sendOtp=async()=>{if(!phone){setError("Enter phone number.");return;}setLoading(true);setError("");const{error}=await supabase.auth.signInWithOtp({phone});if(error)setError(error.message);else{setOtpSent(true);setSuccess("OTP sent!");}setLoading(false);};
  const verifyOtp=async()=>{setLoading(true);setError("");const{error}=await supabase.auth.verifyOtp({phone,token:otp,type:"sms"});if(error)setError(error.message);setLoading(false);};

  return(
    <div style={{fontFamily:"'Segoe UI',sans-serif",minHeight:"100vh",background:C.bg}}>
      <div style={{background:`linear-gradient(135deg,${C.orange},#FF4500)`,padding:"48px 24px 40px",color:"#fff",textAlign:"center"}}>
        <div style={{fontSize:48,marginBottom:12}}>🚗</div>
        <div style={{fontWeight:900,fontSize:28}}>DriveLicenceLab</div>
        <div style={{opacity:.85,marginTop:8,fontSize:15}}>Your SA K53 Driving Licence Platform</div>
      </div>
      <div style={{padding:24}}>
        <div style={{display:"flex",background:C.card,borderRadius:12,padding:4,marginBottom:24,border:`1px solid ${C.border}`}}>
          {[{id:"login",l:"Login"},{id:"signup",l:"Sign Up"},{id:"phone",l:"📱 Phone"}].map(t=>(
            <button key={t.id} onClick={()=>{setMode(t.id);setError("");setSuccess("");}} style={{flex:1,padding:"10px",background:mode===t.id?C.teal:"transparent",color:mode===t.id?"#fff":C.textMuted,border:"none",borderRadius:10,fontWeight:700,cursor:"pointer",fontSize:14}}>{t.l}</button>
          ))}
        </div>
        <Alert msg={error}/><Alert msg={success} type="success"/>
        <button onClick={google} style={{width:"100%",padding:"13px",border:`1.5px solid ${C.border}`,borderRadius:10,background:C.card,display:"flex",alignItems:"center",justifyContent:"center",gap:10,cursor:"pointer",fontWeight:700,fontSize:15,marginBottom:20,color:C.navy}}>
          <span style={{fontSize:20}}>🔵</span> Continue with Google
        </button>
        <div style={{textAlign:"center",color:C.textMuted,fontSize:13,marginBottom:20}}>— or —</div>
        {mode==="login"&&(<><Input label="Email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@email.com" type="email" required/><Input label="Password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Your password" type="password" required/><Btn full color={C.teal} onClick={login} disabled={loading}>{loading?"Logging in…":"Login"}</Btn></>)}
        {mode==="signup"&&(<>
          <Input label="Full Name" value={fullName} onChange={e=>setFullName(e.target.value)} placeholder="John Smith" required/>
          <Input label="Email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@email.com" type="email" required/>
          <Input label="Password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Min 6 characters" type="password" required/>
          <div style={{marginBottom:18}}>
            <label style={{display:"block",fontWeight:700,color:C.navy,marginBottom:6,fontSize:14}}>I am a <span style={{color:C.red}}>*</span></label>
            <div style={{display:"flex",gap:8}}>
              {[{v:"student",l:"🎓 Student"},{v:"instructor",l:"👨‍🏫 Instructor"},{v:"admin",l:"🏫 Admin"}].map(r=>(
                <button key={r.v} onClick={()=>setRole(r.v)} style={{flex:1,padding:"10px 4px",border:`2px solid ${role===r.v?C.teal:C.border}`,borderRadius:10,background:role===r.v?C.teal+"15":C.card,color:role===r.v?C.teal:C.navy,fontWeight:700,cursor:"pointer",fontSize:12}}>{r.l}</button>
              ))}
            </div>
          </div>
          <Btn full color={C.teal} onClick={signup} disabled={loading}>{loading?"Creating…":"Create Account"}</Btn>
        </>)}
        {mode==="phone"&&(<>
          <Input label="Phone Number" value={phone} onChange={e=>setPhone(e.target.value)} placeholder="+27 72 123 4567" type="tel" required/>
          {otpSent&&<Input label="OTP Code" value={otp} onChange={e=>setOtp(e.target.value)} placeholder="6-digit code" required/>}
          {!otpSent?<Btn full color={C.teal} onClick={sendOtp} disabled={loading}>{loading?"Sending…":"Send OTP"}</Btn>:<Btn full color={C.teal} onClick={verifyOtp} disabled={loading}>{loading?"Verifying…":"Verify OTP"}</Btn>}
        </>)}
      </div>
    </div>
  );
};

// ONBOARDING
const Onboarding=({user,onDone})=>{
  const[step,setStep]=useState(0);const[saId,setSaId]=useState("");const[dob,setDob]=useState("");const[phone,setPhone]=useState("");const[loading,setLoading]=useState(false);const[error,setError]=useState("");
  const features=[{icon:"🏫",title:"School-Based Training",sub:"Train with DLTC-certified instructors right at your school."},{icon:"📅",title:"4-Week Programme",sub:"Theory, practical & assessment — all structured and tracked."},{icon:"🎓",title:"K53 Curriculum",sub:"Live progress tracking aligned with the official K53 syllabus."},{icon:"✅",title:"Licence-Ready",sub:"Graduate prepared to pass your official DLTC road test."}];
  const save=async()=>{if(!saId||!dob){setError("SA ID and Date of Birth are required.");return;}setLoading(true);const{error}=await supabase.from("profiles").update({sa_id:saId,date_of_birth:dob,phone}).eq("id",user.id);if(error)setError(error.message);else onDone();setLoading(false);};
  return(
    <div style={{fontFamily:"'Segoe UI',sans-serif",minHeight:"100vh",background:C.bg}}>
      <div style={{background:C.card,padding:"16px 20px",display:"flex",alignItems:"center",gap:10,borderBottom:`1px solid ${C.border}`}}>
        <span style={{fontSize:22}}>🚗</span><span style={{fontWeight:800,color:C.navy,fontSize:18}}>DriveLicenceLab</span>
      </div>
      <div style={{height:4,background:C.border}}><div style={{height:4,background:C.teal,width:`${(step+1)/2*100}%`,transition:"width .3s"}}/></div>
      <div style={{padding:24}}>
        {step===0&&(<>
          <div style={{textAlign:"center",marginBottom:28}}>
            <div style={{fontSize:48,background:C.teal+"22",borderRadius:16,width:72,height:72,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px"}}>🚗</div>
            <h2 style={{fontWeight:800,color:C.navy,margin:0}}>Welcome to DriveLicenceLab</h2>
            <p style={{color:C.textMuted,marginTop:8}}>Your journey to your SA driver's licence starts here.</p>
          </div>
          {features.map((f,i)=>(<Card key={i} style={{marginBottom:12,display:"flex",gap:14,alignItems:"flex-start"}}><span style={{fontSize:24}}>{f.icon}</span><div><div style={{fontWeight:700,color:C.navy}}>{f.title}</div><div style={{fontSize:13,color:C.textMuted,marginTop:3}}>{f.sub}</div></div></Card>))}
          <Btn full color={C.teal} onClick={()=>setStep(1)}>Continue →</Btn>
        </>)}
        {step===1&&(<>
          <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:24}}>
            <div style={{background:C.teal+"22",borderRadius:12,width:44,height:44,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22}}>👤</div>
            <div><div style={{fontWeight:800,color:C.navy,fontSize:18}}>Personal Details</div><div style={{color:C.textMuted,fontSize:13}}>We need a few details to set up your profile.</div></div>
          </div>
          <Alert msg={error}/>
          <Card>
            <Input label="SA ID Number" value={saId} onChange={e=>setSaId(e.target.value)} placeholder="e.g. 0612156123084" required/>
            <Input label="Date of Birth" value={dob} onChange={e=>setDob(e.target.value)} type="date" required/>
            <Input label="Phone Number (optional)" value={phone} onChange={e=>setPhone(e.target.value)} placeholder="e.g. 072 123 4567"/>
          </Card>
          <div style={{display:"flex",gap:12,marginTop:20}}>
            <Btn outline color={C.navy} onClick={()=>setStep(0)}>‹ Back</Btn>
            <Btn full color={C.teal} onClick={save} disabled={loading}>{loading?"Saving…":"Continue →"}</Btn>
          </div>
          <p style={{textAlign:"center",fontSize:12,color:C.textMuted,marginTop:12}}>Your information is secure and only used for training management.</p>
        </>)}
      </div>
    </div>
  );
};

// QUIZ DATA
const QZ=[
  {q:"What does a solid white line on the left edge of a road indicate?",opts:["The edge of the roadway","A bicycle lane","Parking is allowed","No overtaking zone"],ans:0},
  {q:"When must you use your headlights?",opts:["Only at night","From sunset to sunrise and when visibility is poor","Only in rain","Whenever you want"],ans:1},
  {q:"What is the speed limit in a residential area unless otherwise indicated?",opts:["80 km/h","100 km/h","60 km/h","40 km/h"],ans:2},
  {q:"A flashing red traffic light means?",opts:["Slow down","Stop, then proceed when safe","Stop permanently","Yield to oncoming traffic"],ans:1},
  {q:"When following another vehicle at night, you should use?",opts:["High beam lights","Hazard lights","Low beam lights","No lights"],ans:2},
  {q:"What does a yellow/amber traffic light mean?",opts:["Speed up","Stop if safe to do so","Proceed normally","Yield to pedestrians"],ans:1},
  {q:"What is the minimum following distance on a highway?",opts:["1 second","2 seconds","3 seconds","4 seconds"],ans:2},
];

// STUDENT APP
const StudentApp=({profile,onSignOut})=>{
  const[tab,setTab]=useState("home");
  const[qi,setQi]=useState(0);const[qs,setQs]=useState(0);const[qd,setQd]=useState(false);const[sel,setSel]=useState(null);
  const[rt,setRt]=useState("quiz");
  const[aiMsg,setAiMsg]=useState("");const[aiChat,setAiChat]=useState([]);const[aiLoad,setAiLoad]=useState(false);
  const[xp,setXp]=useState({xp_points:0,streak_days:0});const[badges,setBadges]=useState([]);const[hist,setHist]=useState([]);

  useEffect(()=>{loadXp();loadBadges();loadHist();},[]);
  const loadXp=async()=>{const{data}=await supabase.from("student_xp").select("*").eq("student_id",profile.id).single();if(data)setXp(data);};
  const loadBadges=async()=>{const{data}=await supabase.from("badges").select("*").eq("student_id",profile.id);if(data)setBadges(data);};
  const loadHist=async()=>{const{data}=await supabase.from("quiz_scores").select("*").eq("student_id",profile.id).order("completed_at",{ascending:false}).limit(5);if(data)setHist(data);};

  const answer=async(idx)=>{
    if(sel!==null)return;setSel(idx);const ok=idx===QZ[qi].ans;if(ok)setQs(s=>s+1);
    setTimeout(async()=>{
      if(qi+1<QZ.length){setQi(i=>i+1);setSel(null);}
      else{const fs=qs+(ok?1:0);setQd(true);
        await supabase.from("quiz_scores").insert({student_id:profile.id,score:fs,total:QZ.length,percentage:(fs/QZ.length*100).toFixed(2)});
        const nx=(xp.xp_points||0)+fs*10;await supabase.from("student_xp").update({xp_points:nx}).eq("student_id",profile.id);setXp(x=>({...x,xp_points:nx}));
        if(hist.length===0){await supabase.from("badges").insert({student_id:profile.id,badge_name:"First Quiz",badge_icon:"📝"});loadBadges();}
        loadHist();}
    },900);
  };
  const resetQ=()=>{setQi(0);setQs(0);setQd(false);setSel(null);};

  const sendAi=async()=>{
    if(!aiMsg.trim())return;const um=aiMsg;setAiMsg("");setAiChat(c=>[...c,{role:"user",text:um}]);setAiLoad(true);
    try{const r=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-6",max_tokens:1000,system:"You are an expert K53 driving tutor for South Africa. Answer concisely and clearly.",messages:[...aiChat.map(m=>({role:m.role,content:m.text})),{role:"user",content:um}]})});const d=await r.json();setAiChat(c=>[...c,{role:"assistant",text:d.content?.map(b=>b.text||"").join("")||"Sorry, try again."}]);}
    catch{setAiChat(c=>[...c,{role:"assistant",text:"Network error. Please try again."}]);}
    setAiLoad(false);
  };

  const TABS=[{id:"home",icon:"🏠",label:"Home"},{id:"study",icon:"📚",label:"Study"},{id:"resources",icon:"📖",label:"Resources"},{id:"ai",icon:"🤖",label:"AI Tutor"},{id:"profile",icon:"👤",label:"Profile"}];
  return(
    <div style={{fontFamily:"'Segoe UI',sans-serif",background:C.bg,minHeight:"100vh",paddingBottom:80}}>
      <div style={{background:C.card,borderBottom:`1px solid ${C.border}`,padding:"14px 20px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}><span style={{fontSize:22}}>🚗</span><span style={{fontWeight:800,color:C.navy,fontSize:17}}>DriveLicenceLab</span></div>
        <button onClick={onSignOut} style={{background:C.bg,border:"none",borderRadius:8,padding:"6px 12px",cursor:"pointer",fontSize:13,color:C.textMuted}}>Sign Out</button>
      </div>
      <div style={{padding:20}}>
        {tab==="home"&&(<>
          <div style={{background:`linear-gradient(135deg,${C.teal},${C.tealDark})`,borderRadius:20,padding:24,color:"#fff",marginBottom:20}}>
            <div style={{fontSize:13,opacity:.8}}>Welcome back 👋</div>
            <div style={{fontWeight:800,fontSize:20,marginTop:4}}>{profile.full_name||"Student"}</div>
            <div style={{display:"flex",gap:8,marginTop:20}}>
              {[{v:xp.xp_points||0,l:"XP Earned"},{v:`${xp.streak_days||0}🔥`,l:"Streak"},{v:badges.length,l:"Badges"}].map((s,i)=>(<div key={i} style={{flex:1,textAlign:"center"}}><div style={{fontWeight:800,fontSize:22}}>{s.v}</div><div style={{fontSize:11,opacity:.8}}>{s.l}</div></div>))}
            </div>
          </div>
          <div style={{fontWeight:700,color:C.navy,marginBottom:12}}>Recent Quiz Results</div>
          {hist.length===0?<EmptyState icon="📝" title="No quizzes yet" subtitle="Take your first practice quiz to earn XP!"/>:hist.map((q,i)=>(<Card key={i} style={{marginBottom:10,display:"flex",justifyContent:"space-between",alignItems:"center"}}><div><div style={{fontWeight:700,color:C.navy}}>Practice Quiz</div><div style={{fontSize:13,color:C.textMuted}}>{new Date(q.completed_at).toLocaleDateString()}</div></div><div style={{fontWeight:800,color:q.percentage>=70?C.green:C.red,fontSize:18}}>{q.percentage}%</div></Card>))}
          <div style={{fontWeight:700,color:C.navy,margin:"20px 0 12px"}}>Quick Actions</div>
          {[{icon:"📖",label:"Practice Quiz",sub:"Test your K53 knowledge",action:()=>{setTab("resources");setRt("quiz");}},{icon:"🤖",label:"Ask AI Tutor",sub:"Get instant answers",action:()=>setTab("ai")}].map((a,i)=>(<Card key={i} style={{marginBottom:12,cursor:"pointer"}}><div onClick={a.action} style={{display:"flex",alignItems:"center",gap:14}}><div style={{fontSize:24,background:C.teal+"22",borderRadius:10,width:44,height:44,display:"flex",alignItems:"center",justifyContent:"center"}}>{a.icon}</div><div style={{flex:1}}><div style={{fontWeight:700,color:C.navy}}>{a.label}</div><div style={{fontSize:13,color:C.textMuted}}>{a.sub}</div></div><span style={{color:C.textMuted}}>›</span></div></Card>))}
        </>)}
        {tab==="study"&&(<>
          <div style={{fontWeight:800,color:C.navy,fontSize:22,marginBottom:4}}>Progress</div>
          <div style={{color:C.textMuted,marginBottom:20}}>Track your training</div>
          <Card style={{marginBottom:16}}>
            <div style={{fontWeight:700,color:C.navy,marginBottom:14}}>Quiz Performance</div>
            {hist.length===0?<div style={{color:C.textMuted,fontSize:14}}>No quiz data yet.</div>:<>
              <div style={{fontSize:13,color:C.textMuted,marginBottom:8}}>Average: <strong style={{color:C.teal}}>{(hist.reduce((a,q)=>a+Number(q.percentage),0)/hist.length).toFixed(1)}%</strong></div>
              {hist.map((q,i)=>(<div key={i} style={{marginBottom:8}}><div style={{display:"flex",justifyContent:"space-between",fontSize:13,marginBottom:4}}><span style={{color:C.textMuted}}>{new Date(q.completed_at).toLocaleDateString()}</span><span style={{fontWeight:700,color:q.percentage>=70?C.green:C.red}}>{q.percentage}%</span></div><div style={{height:6,background:C.border,borderRadius:4}}><div style={{height:6,background:q.percentage>=70?C.green:C.red,borderRadius:4,width:`${q.percentage}%`}}/></div></div>))}
            </>}
          </Card>
          <div style={{fontWeight:700,color:C.navy,marginBottom:12}}>My Badges</div>
          {badges.length===0?<EmptyState icon="🏅" title="No badges yet" subtitle="Complete quizzes to earn badges!"/>:<div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>{badges.map((b,i)=>(<Card key={i} style={{textAlign:"center",padding:16}}><div style={{fontSize:28}}>{b.badge_icon}</div><div style={{fontSize:12,fontWeight:700,color:C.navy,marginTop:6}}>{b.badge_name}</div></Card>))}</div>}
        </>)}
        {tab==="resources"&&(<>
          <div style={{background:`linear-gradient(135deg,${C.teal},${C.tealDark})`,borderRadius:16,padding:"18px 20px",color:"#fff",marginBottom:16}}>
            <div style={{fontWeight:800,fontSize:20}}>Resource Library</div>
            <div style={{fontSize:13,opacity:.8,marginTop:4}}>K53 practice · Road signs · DLTC checklist</div>
          </div>
          <div style={{display:"flex",gap:0,marginBottom:20,borderBottom:`2px solid ${C.border}`}}>
            {[{id:"quiz",l:"📝 Quiz"},{id:"signs",l:"🚦 Signs"},{id:"dltc",l:"📋 DLTC"}].map(t=>(<button key={t.id} onClick={()=>setRt(t.id)} style={{flex:1,background:"none",border:"none",cursor:"pointer",padding:"10px 4px",fontWeight:rt===t.id?700:400,color:rt===t.id?C.teal:C.textMuted,borderBottom:rt===t.id?`2px solid ${C.teal}`:"2px solid transparent",fontSize:13,marginBottom:-2}}>{t.l}</button>))}
          </div>
          {rt==="quiz"&&(qd?<Card style={{textAlign:"center",padding:40}}><div style={{fontSize:48}}>🎉</div><div style={{fontWeight:800,color:C.navy,fontSize:22,marginTop:12}}>Quiz Complete!</div><div style={{color:C.textMuted,marginTop:8}}>Score: <strong style={{color:C.teal}}>{qs}/{QZ.length}</strong> · +{qs*10} XP!</div><div style={{marginTop:20}}><Btn color={C.teal} onClick={resetQ}>Try Again</Btn></div></Card>:
            <Card>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:12}}><span style={{color:C.textMuted,fontSize:14}}>Q {qi+1}/{QZ.length}</span><span style={{color:C.teal,fontWeight:700,fontSize:14}}>{qs} correct</span></div>
              <div style={{height:4,background:C.border,borderRadius:4,marginBottom:20}}><div style={{height:4,background:C.teal,borderRadius:4,width:`${qi/QZ.length*100}%`}}/></div>
              <div style={{fontWeight:700,color:C.navy,fontSize:16,marginBottom:20}}>{QZ[qi].q}</div>
              {QZ[qi].opts.map((opt,i)=>{let bg=C.bg,border=C.border,color=C.navy;if(sel!==null){if(i===QZ[qi].ans){bg=C.green+"22";border=C.green;color=C.green;}else if(i===sel){bg=C.red+"22";border=C.red;color=C.red;}}return(<div key={i} onClick={()=>answer(i)} style={{border:`1.5px solid ${border}`,borderRadius:12,padding:"14px 16px",marginBottom:10,cursor:"pointer",background:bg,color,fontWeight:500}}><strong>{String.fromCharCode(65+i)}.</strong> {opt}</div>);})}
            </Card>
          )}
          {rt==="signs"&&(<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>{[{s:"🛑",n:"Stop Sign",d:"Come to a complete stop"},{s:"⚠️",n:"Warning Sign",d:"Hazard ahead"},{s:"🚫",n:"No Entry",d:"Do not enter"},{s:"🔄",n:"Roundabout",d:"Give way to traffic"},{s:"🚶",n:"Pedestrian",d:"Yield to pedestrians"},{s:"🅿️",n:"Parking",d:"Parking permitted here"}].map((s,i)=>(<Card key={i} style={{textAlign:"center",padding:16}}><div style={{fontSize:36,marginBottom:8}}>{s.s}</div><div style={{fontWeight:700,color:C.navy,fontSize:13}}>{s.n}</div><div style={{color:C.textMuted,fontSize:12,marginTop:4}}>{s.d}</div></Card>))}</div>)}
          {rt==="dltc"&&([{section:"Before the Test",items:["Valid learner's licence","Roadworthy vehicle","Proof of booking","Valid ID document"]},{section:"Vehicle Check",items:["Lights & indicators","Brakes & handbrake","Tyres & mirrors","Horn & wipers"]},{section:"K53 Manoeuvres",items:["Alley docking","Parallel parking","3-point turn","Emergency stop"]}].map((s,i)=>(<Card key={i} style={{marginBottom:14}}><div style={{fontWeight:700,color:C.navy,marginBottom:12}}>{s.section}</div>{s.items.map((item,j)=>(<div key={j} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 0",borderBottom:j<s.items.length-1?`1px solid ${C.border}`:"none"}}><span style={{color:C.teal,fontSize:16}}>✓</span><span style={{fontSize:14,color:C.navy}}>{item}</span></div>))}</Card>)))}
        </>)}
        {tab==="ai"&&(<>
          <div style={{fontWeight:800,color:C.navy,fontSize:22,marginBottom:4}}>AI Driving Assistant</div>
          <div style={{color:C.textMuted,marginBottom:16}}>Your personal K53 tutor — available 24/7</div>
          <Card style={{background:`linear-gradient(135deg,${C.teal},${C.tealDark})`,marginBottom:16}}><div style={{display:"flex",gap:12,alignItems:"center"}}><div style={{fontSize:28,background:"rgba(255,255,255,.2)",borderRadius:10,width:44,height:44,display:"flex",alignItems:"center",justifyContent:"center"}}>🧠</div><div style={{color:"#fff"}}><div style={{fontWeight:700,fontSize:16}}>AI Driving Assistant</div><div style={{fontSize:13,opacity:.85}}>K53 Specialist · Available 24/7</div></div></div></Card>
          <div style={{maxHeight:320,overflowY:"auto",marginBottom:16,display:"flex",flexDirection:"column",gap:10}}>
            {aiChat.length===0&&(<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>{["K53 Road Signs","Parallel Parking","Emergency Stop","Speed Limits"].map(t=>(<Card key={t} style={{cursor:"pointer",textAlign:"center",padding:14}}><div onClick={()=>setAiMsg(t)} style={{color:C.teal,fontWeight:600,fontSize:14}}>📖 {t}</div></Card>))}</div>)}
            {aiChat.map((m,i)=>(<div key={i} style={{display:"flex",justifyContent:m.role==="user"?"flex-end":"flex-start"}}><div style={{maxWidth:"82%",background:m.role==="user"?C.teal:C.card,color:m.role==="user"?"#fff":C.navy,border:m.role==="assistant"?`1px solid ${C.border}`:"none",borderRadius:m.role==="user"?"18px 18px 4px 18px":"18px 18px 18px 4px",padding:"12px 16px",fontSize:14,lineHeight:1.5}}>{m.text}</div></div>))}
            {aiLoad&&<div style={{color:C.textMuted,fontSize:14}}>AI is thinking…</div>}
          </div>
          <Card style={{padding:12}}><div style={{display:"flex",gap:10}}><input value={aiMsg} onChange={e=>setAiMsg(e.target.value)} onKeyDown={e=>e.key==="Enter"&&sendAi()} placeholder="Ask a K53 question…" style={{flex:1,border:`1.5px solid ${C.border}`,borderRadius:10,padding:"11px 14px",fontSize:14,outline:"none"}}/><Btn color={C.teal} onClick={sendAi} small>Send</Btn></div></Card>
        </>)}
        {tab==="profile"&&(<>
          <div style={{textAlign:"center",marginBottom:24}}>
            <div style={{fontSize:48,background:C.teal+"22",borderRadius:"50%",width:80,height:80,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 12px"}}>🎓</div>
            <div style={{fontWeight:800,color:C.navy,fontSize:20}}>{profile.full_name||"Student"}</div>
            <div style={{color:C.textMuted,fontSize:14}}>{profile.email}</div>
          </div>
          <Card style={{marginBottom:14}}><div style={{fontWeight:700,color:C.navy,marginBottom:14}}>My Stats</div><div style={{display:"flex",gap:8}}>{[{v:xp.xp_points||0,l:"XP",c:C.orange},{v:badges.length,l:"Badges",c:C.teal},{v:hist.length,l:"Quizzes",c:C.purple}].map((s,i)=>(<div key={i} style={{flex:1,textAlign:"center"}}><div style={{fontWeight:800,color:s.c,fontSize:22}}>{s.v}</div><div style={{fontSize:12,color:C.textMuted}}>{s.l}</div></div>))}</div></Card>
          <Btn full outline color={C.red} onClick={onSignOut}>Sign Out</Btn>
        </>)}
      </div>
      <BottomNav tabs={TABS} active={tab} setActive={setTab}/>
    </div>
  );
};

// INSTRUCTOR APP
const InstructorApp=({profile,onSignOut})=>{
  const[tab,setTab]=useState("students");const[scanning,setScanning]=useState(false);
  const[feedback,setFeedback]=useState([]);const[students,setStudents]=useState([]);
  useEffect(()=>{loadF();loadS();},[]);
  const loadF=async()=>{const{data}=await supabase.from("instructor_feedback").select("*").eq("instructor_id",profile.id);if(data)setFeedback(data);};
  const loadS=async()=>{const{data}=await supabase.from("enrollments").select("*, profiles!student_id(full_name,email), time_slots(name,day)").eq("instructor_id",profile.id);if(data)setStudents(data);};
  const avg=feedback.length?(feedback.reduce((a,f)=>a+f.rating,0)/feedback.length).toFixed(1):null;
  const TABS=[{id:"students",icon:"👥",label:"Students"},{id:"qr",icon:"📷",label:"Check-In"},{id:"feedback",icon:"⭐",label:"Feedback"},{id:"analytics",icon:"📊",label:"Analytics"},{id:"profile",icon:"👤",label:"Profile"}];
  return(
    <div style={{fontFamily:"'Segoe UI',sans-serif",background:C.bg,minHeight:"100vh",paddingBottom:80}}>
      <div style={{background:C.card,borderBottom:`1px solid ${C.border}`,padding:"14px 20px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div><div style={{fontWeight:800,color:C.navy,fontSize:17}}>Instructor Portal</div><div style={{fontSize:12,color:C.textMuted}}>{profile.full_name}</div></div>
        <button onClick={onSignOut} style={{background:C.bg,border:"none",borderRadius:8,padding:"6px 12px",cursor:"pointer",fontSize:13,color:C.textMuted}}>Sign Out</button>
      </div>
      <div style={{padding:20}}>
        {tab==="students"&&(<><div style={{fontWeight:800,color:C.navy,fontSize:20,marginBottom:4}}>My Students</div><div style={{color:C.textMuted,marginBottom:16}}>{students.length} students assigned</div>{students.length===0?<EmptyState title="No Students" subtitle="No assigned students yet."/>:students.map((s,i)=>(<Card key={i} style={{marginBottom:12}}><div style={{fontWeight:700,color:C.navy}}>{s.profiles?.full_name}</div><div style={{fontSize:13,color:C.textMuted}}>{s.profiles?.email}</div><div style={{fontSize:13,color:C.teal,marginTop:4}}>{s.time_slots?.name} · {s.time_slots?.day}</div></Card>))}</>)}
        {tab==="qr"&&(<><div style={{fontWeight:800,color:C.navy,fontSize:20,marginBottom:4}}>QR Check-In</div><div style={{color:C.textMuted,marginBottom:20}}>Scan student QR codes to mark attendance</div><Card style={{textAlign:"center",padding:40}}><div style={{fontSize:48,marginBottom:16}}>{scanning?"🔍":"📷"}</div><div style={{fontWeight:700,color:C.navy,marginBottom:8}}>{scanning?"Scanning…":"Ready to scan"}</div><div style={{color:C.textMuted,fontSize:14,marginBottom:24}}>Point camera at student QR code.</div>{!scanning?<Btn full color={C.teal} onClick={()=>setScanning(true)}>📷 Start Scanning</Btn>:<Btn outline color={C.red} onClick={()=>setScanning(false)}>Stop Scanning</Btn>}</Card></>)}
        {tab==="feedback"&&(<>
          <div style={{fontWeight:800,color:C.navy,fontSize:20,marginBottom:16}}>My Feedback</div>
          <div style={{display:"flex",gap:10,marginBottom:16}}>{[{v:avg?`${avg}★`:"—",l:"Avg Rating"},{v:feedback.length,l:"Reviews"},{v:feedback.filter(f=>f.flagged).length,l:"Flagged 🚩"}].map((s,i)=>(<Card key={i} style={{flex:1,textAlign:"center",padding:16}}><div style={{fontSize:20,fontWeight:800,color:C.navy}}>{s.v}</div><div style={{fontSize:12,color:C.textMuted,marginTop:4}}>{s.l}</div></Card>))}</div>
          <Card style={{marginBottom:16}}><div style={{fontWeight:700,color:C.navy,marginBottom:14}}>Rating Distribution</div>{[5,4,3,2,1].map(star=>{const cnt=feedback.filter(f=>f.rating===star).length;const pct=feedback.length?cnt/feedback.length*100:0;return(<div key={star} style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}><span style={{fontSize:14,width:20}}>{star}</span><span style={{color:C.yellow}}>⭐</span><div style={{flex:1,height:8,background:C.border,borderRadius:4}}><div style={{height:8,background:C.yellow,borderRadius:4,width:`${pct}%`}}/></div><span style={{fontSize:13,color:C.textMuted,width:20}}>{cnt}</span></div>);})}</Card>
          {feedback.length===0?<EmptyState icon="💬" title="No feedback yet" subtitle="Student reviews will appear here."/>:feedback.map((f,i)=>(<Card key={i} style={{marginBottom:12}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}><div style={{fontWeight:700,color:C.navy}}>Student</div><div style={{color:C.yellow}}>{"★".repeat(f.rating)}{"☆".repeat(5-f.rating)}</div></div>{f.comment&&<div style={{fontSize:14,color:C.textMuted}}>{f.comment}</div>}</Card>))}
        </>)}
        {tab==="analytics"&&(<><div style={{fontWeight:800,color:C.navy,fontSize:20,marginBottom:16}}>Analytics</div><Card style={{marginBottom:14}}><div style={{fontWeight:700,color:C.navy,marginBottom:8}}>📊 Teaching Hours</div><div style={{textAlign:"center",padding:20,color:C.textMuted}}>0h this month</div></Card><Card><div style={{fontWeight:700,color:C.navy,marginBottom:14}}>📈 Student Retention</div><div style={{display:"flex",alignItems:"center",gap:20}}><div style={{width:80,height:80,borderRadius:"50%",border:`6px solid ${C.teal}`,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,color:C.navy}}>100%</div><div style={{flex:1}}><div style={{fontSize:13,color:C.navy,marginBottom:6}}>Retained: <strong style={{color:C.teal}}>100%</strong></div><div style={{height:6,background:C.teal,borderRadius:4,marginBottom:10}}/><div style={{fontSize:12,color:C.textMuted}}>{students.length} students tracked</div></div></div></Card></>)}
        {tab==="profile"&&(<><div style={{textAlign:"center",marginBottom:24}}><div style={{fontSize:48,background:C.teal+"22",borderRadius:"50%",width:80,height:80,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 12px"}}>👨‍🏫</div><div style={{fontWeight:800,color:C.navy,fontSize:20}}>{profile.full_name}</div><div style={{color:C.textMuted,fontSize:14}}>{profile.email}</div></div><Card style={{marginBottom:16}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}><div style={{fontWeight:700,color:C.navy}}>Performance Overview</div><Btn small outline color={C.navy}>↓ Export PDF</Btn></div><div style={{display:"flex",gap:8}}>{[{v:avg||"—",l:"Avg Rating"},{v:feedback.length,l:"Reviews"},{v:students.length,l:"Students"}].map((s,i)=>(<div key={i} style={{flex:1,textAlign:"center"}}><div style={{fontWeight:800,color:C.navy,fontSize:22}}>{s.v}</div><div style={{fontSize:12,color:C.textMuted}}>{s.l}</div></div>))}</div></Card><Btn full outline color={C.red} onClick={onSignOut}>Sign Out</Btn></>)}
      </div>
      <BottomNav tabs={TABS} active={tab} setActive={setTab}/>
    </div>
  );
};

// ADMIN APP
const AdminApp=({profile,onSignOut})=>{
  const[tab,setTab]=useState("scheduling");const[slots,setSlots]=useState([]);const[enrollments,setEnrollments]=useState([]);
  const[showAdd,setShowAdd]=useState(false);const[ns,setNs]=useState({name:"",day:"MONDAY",start:"",end:"",capacity:20});
  const[loading,setLoading]=useState(false);const[schoolId,setSchoolId]=useState(null);
  useEffect(()=>{init();},[]);
  const init=async()=>{let{data:sc}=await supabase.from("schools").select("*").eq("admin_id",profile.id).single();if(!sc){const{data}=await supabase.from("schools").insert({name:"DriveLicenceLab School",admin_id:profile.id}).select().single();sc=data;}if(sc){setSchoolId(sc.id);loadSlots(sc.id);loadEnroll(sc.id);}};
  const loadSlots=async(sid)=>{const{data}=await supabase.from("time_slots").select("*").eq("school_id",sid).order("day");if(data)setSlots(data);};
  const loadEnroll=async(sid)=>{const slotIds=(await supabase.from("time_slots").select("id").eq("school_id",sid)).data?.map(s=>s.id)||[];if(slotIds.length===0)return;const{data}=await supabase.from("enrollments").select("*, profiles!student_id(full_name,email), time_slots(name,day)").in("slot_id",slotIds);if(data)setEnrollments(data);};
  const addSlot=async()=>{if(!ns.name||!ns.start||!ns.end||!schoolId)return;setLoading(true);await supabase.from("time_slots").insert({school_id:schoolId,name:ns.name,day:ns.day,start_time:ns.start,end_time:ns.end,capacity:ns.capacity});setNs({name:"",day:"MONDAY",start:"",end:"",capacity:20});setShowAdd(false);loadSlots(schoolId);setLoading(false);};
  const toggleSlot=async(sl)=>{await supabase.from("time_slots").update({active:!sl.active}).eq("id",sl.id);loadSlots(schoolId);};
  const deleteSlot=async(id)=>{await supabase.from("time_slots").delete().eq("id",id);loadSlots(schoolId);};
  const grouped=slots.reduce((a,s)=>{(a[s.day]=a[s.day]||[]).push(s);return a;},{});
  const TABS=[{id:"students",icon:"👥",label:"Students"},{id:"slots",icon:"⏰",label:"Time Slots"},{id:"scheduling",icon:"📅",label:"Scheduling"}];
  return(
    <div style={{fontFamily:"'Segoe UI',sans-serif",background:C.bg,minHeight:"100vh",paddingBottom:80}}>
      <div style={{background:C.card,borderBottom:`1px solid ${C.border}`,padding:"14px 20px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div><div style={{fontWeight:800,color:C.navy,fontSize:17}}>School Admin</div><div style={{fontSize:12,color:C.textMuted}}>{profile.full_name}</div></div>
        <button onClick={onSignOut} style={{background:C.bg,border:"none",borderRadius:8,padding:"6px 12px",cursor:"pointer",fontSize:13,color:C.textMuted}}>Sign Out</button>
      </div>
      <div style={{padding:20}}>
        {tab==="students"&&(<><div style={{fontWeight:800,color:C.navy,fontSize:20,marginBottom:4}}>Students</div><div style={{color:C.textMuted,marginBottom:16}}>{enrollments.length} enrollments</div>{enrollments.length===0?<EmptyState title="No Students" subtitle="No enrollments yet."/>:enrollments.map((e,i)=>(<Card key={i} style={{marginBottom:12}}><div style={{fontWeight:700,color:C.navy}}>{e.profiles?.full_name}</div><div style={{fontSize:13,color:C.textMuted}}>{e.profiles?.email}</div><div style={{fontSize:13,color:C.teal,marginTop:4}}>{e.time_slots?.name} · {e.time_slots?.day}</div></Card>))}</>)}
        {tab==="slots"&&(<>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}><div><div style={{fontWeight:800,color:C.navy,fontSize:20}}>Time Slots</div><div style={{color:C.textMuted,fontSize:13}}>{slots.filter(s=>s.active).length} active slots</div></div><Btn color={C.teal} small onClick={()=>setShowAdd(true)}>+ Add Slot</Btn></div>
          {showAdd&&(<Card style={{marginBottom:16,border:`2px solid ${C.teal}`}}><div style={{fontWeight:700,color:C.navy,marginBottom:12}}>New Time Slot</div><Input label="Slot Name" value={ns.name} onChange={e=>setNs({...ns,name:e.target.value})} placeholder="e.g. Slot D — Evening" required/><div style={{marginBottom:14}}><label style={{fontSize:13,fontWeight:600,color:C.navy,display:"block",marginBottom:6}}>Day</label><select value={ns.day} onChange={e=>setNs({...ns,day:e.target.value})} style={{width:"100%",border:`1.5px solid ${C.border}`,borderRadius:8,padding:"12px",fontSize:14,outline:"none"}}>{["MONDAY","TUESDAY","WEDNESDAY","THURSDAY","FRIDAY","SATURDAY"].map(d=><option key={d}>{d}</option>)}</select></div><div style={{display:"flex",gap:10,marginBottom:14}}><div style={{flex:1}}><Input label="Start" value={ns.start} onChange={e=>setNs({...ns,start:e.target.value})} type="time" required/></div><div style={{flex:1}}><Input label="End" value={ns.end} onChange={e=>setNs({...ns,end:e.target.value})} type="time" required/></div></div><Input label="Capacity" value={ns.capacity} onChange={e=>setNs({...ns,capacity:Number(e.target.value)})} type="number"/><div style={{display:"flex",gap:10}}><Btn outline color={C.navy} onClick={()=>setShowAdd(false)}>Cancel</Btn><Btn full color={C.teal} onClick={addSlot} disabled={loading}>{loading?"Adding…":"Add Slot"}</Btn></div></Card>)}
          {Object.keys(grouped).length===0&&<EmptyState icon="⏰" title="No time slots" subtitle="Add your first time slot."/>}
          {Object.entries(grouped).map(([day,ds])=>(<div key={day}><div style={{fontWeight:700,color:C.textMuted,fontSize:12,letterSpacing:1,margin:"16px 0 8px"}}>{day}</div>{ds.map(sl=>(<Card key={sl.id} style={{marginBottom:12}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}><div style={{fontWeight:700,color:C.navy}}>{sl.name}</div><span style={{background:sl.active?C.green+"22":C.border,color:sl.active?C.green:C.textMuted,borderRadius:20,padding:"2px 10px",fontSize:12,fontWeight:600}}>{sl.active?"Active":"Disabled"}</span></div><div style={{color:C.textMuted,fontSize:13,marginBottom:4}}>🕐 {sl.start_time} — {sl.end_time}</div><div style={{color:C.textMuted,fontSize:13,marginBottom:10}}>👤 Capacity: {sl.capacity}</div><div style={{display:"flex",gap:8}}><Btn small outline color={C.navy} onClick={()=>toggleSlot(sl)}>{sl.active?"Disable":"Enable"}</Btn><Btn small danger onClick={()=>deleteSlot(sl.id)}>🗑 Delete</Btn></div></Card>))}</div>))}
        </>)}
        {tab==="scheduling"&&(<>
          <div style={{fontWeight:800,color:C.navy,fontSize:20,marginBottom:4}}>Smart Scheduling</div>
          <div style={{color:C.textMuted,marginBottom:16}}>Auto-assign & conflict-free</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:16}}>{[{l:"Total Slots",v:slots.length,c:C.teal,i:"📅"},{l:"Assigned",v:0,c:C.green,i:"✅"},{l:"Unassigned",v:slots.length,c:C.orange,i:"🕐"},{l:"Conflicts",v:0,c:C.textMuted,i:"⚠️"}].map((s,i)=>(<Card key={i} style={{display:"flex",gap:12,alignItems:"center"}}><span style={{fontSize:24}}>{s.i}</span><div><div style={{fontWeight:800,color:s.c,fontSize:22}}>{s.v}</div><div style={{fontSize:12,color:C.textMuted}}>{s.l}</div></div></Card>))}</div>
          {slots.length>0&&<Card style={{background:C.teal+"15",border:`1.5px solid ${C.teal}44`,marginBottom:16,display:"flex",justifyContent:"space-between",alignItems:"center"}}><div><div style={{fontWeight:700,color:C.navy}}>{slots.length} slots need instructors</div><div style={{fontSize:13,color:C.textMuted,marginTop:4}}>Auto-assign uses availability + load balancing</div></div><Btn color={C.teal} small>⚡ Auto-Assign</Btn></Card>}
          {Object.entries(grouped).map(([day,ds])=>(<div key={day}><div style={{fontWeight:700,color:C.textMuted,fontSize:12,letterSpacing:1,margin:"16px 0 8px"}}>{day}</div>{ds.map(sl=>(<Card key={sl.id} style={{marginBottom:12}}><div style={{fontWeight:700,color:C.navy}}>{sl.name}</div><div style={{color:C.textMuted,fontSize:13,marginTop:4}}>🕐 {sl.start_time} — {sl.end_time} · Cap: {sl.capacity}</div><div style={{marginTop:12,border:`1.5px dashed ${C.border}`,borderRadius:10,padding:"10px 14px",color:C.textMuted,fontSize:14,cursor:"pointer",textAlign:"center"}}>+ Assign Instructor</div></Card>))}</div>))}
          {slots.length===0&&<EmptyState icon="📅" title="No slots yet" subtitle="Add time slots first, then assign instructors."/>}
        </>)}
      </div>
      <BottomNav tabs={TABS} active={tab} setActive={setTab}/>
    </div>
  );
};

// ROOT
export default function App(){
  const[session,setSession]=useState(null);const[profile,setProfile]=useState(null);const[loading,setLoading]=useState(true);const[onboarded,setOnboarded]=useState(false);
  useEffect(()=>{
    supabase.auth.getSession().then(({data:{session}})=>{setSession(session);if(session)loadProfile(session.user.id);else setLoading(false);});
    const{data:{subscription}}=supabase.auth.onAuthStateChange((_,session)=>{setSession(session);if(session)loadProfile(session.user.id);else{setProfile(null);setLoading(false);}});
    return()=>subscription.unsubscribe();
  },[]);
  const loadProfile=async(uid)=>{const{data}=await supabase.from("profiles").select("*").eq("id",uid).single();if(data){setProfile(data);setOnboarded(!!data.sa_id);}setLoading(false);};
  const signOut=async()=>{await supabase.auth.signOut();setProfile(null);setSession(null);setOnboarded(false);};
  if(loading)return(<div style={{fontFamily:"'Segoe UI',sans-serif",display:"flex",alignItems:"center",justifyContent:"center",minHeight:"100vh",flexDirection:"column",gap:16,background:C.bg}}><div style={{fontSize:48}}>🚗</div><div style={{fontWeight:700,color:C.navy}}>Loading DriveLicenceLab…</div></div>);
  if(!session)return<AuthScreen/>;
  if(!onboarded&&profile?.role==="student")return<Onboarding user={session.user} onDone={()=>{setOnboarded(true);loadProfile(session.user.id);}}/>;
  if(!profile)return<div style={{textAlign:"center",padding:40,color:C.textMuted}}>Loading profile…</div>;
  if(profile.role==="instructor")return<InstructorApp profile={profile} onSignOut={signOut}/>;
  if(profile.role==="admin")return<AdminApp profile={profile} onSignOut={signOut}/>;
  return<StudentApp profile={profile} onSignOut={signOut}/>;
}
