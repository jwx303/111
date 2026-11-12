import { useCallback, useEffect, useRef, useState } from 'react';
import type { MouseEvent, ReactNode } from 'react';
import SystemContent, { Asset, Text, Box, Header, Navigation, CameraSelection, Progress, position } from './App';
import type { ParameterValues } from './App';
import Assistant, { AssistantHint } from './Assistant';
import type { AssistantView } from './Assistant';
import './interactions.css';
import CorrectionDialog from './CorrectionDialog';

type Stage = 'login' | 'camera' | 'image' | 'system';
type Point = { x: number; y: number };
type MarkMode = 'locks' | 'arc' | 'perspective' | null;
type SaveFeedback = 'idle' | 'success' | 'error';
type Correction = 'none' | 'arc' | 'perspective' | 'arc-failed' | 'perspective-failed';
const perspectiveOffset = (state: Correction) => state.startsWith('arc') ? 185 : state === 'perspective' ? 157 : state === 'perspective-failed' ? 164 : 163;
const emptyValues: ParameterValues = { center: '', ratio: '', trolley: '', grab: '', result: '' };

function Hit({ x, y, w, h, label, action, disabled = false }: { x: number; y: number; w: number; h: number; label: string; action: () => void; disabled?: boolean }) {
  return <button type="button" className="hit-target" aria-label={label} disabled={disabled} title={disabled ? '请先保存相机配置' : undefined} style={position({ x, y, w, h })} onClick={action} />;
}

function Dropdown({ x, y, w, label, options }: { x: number; y: number; w: number; label: string; options: string[] }) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const close = (e: globalThis.MouseEvent) => { if (!root.current?.contains(e.target as Node)) setOpen(false); };
    const escape = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', close); document.addEventListener('keydown', escape);
    return () => { document.removeEventListener('mousedown', close); document.removeEventListener('keydown', escape); };
  }, []);
  return <div className={`dropdown-anchor ${open ? 'dropdown-open' : ''}`} style={position({ x, y, w, h: 40 })} ref={root}>
    <button type="button" className="hit-target" aria-label={label} aria-expanded={open} aria-haspopup="listbox" onClick={() => setOpen(!open)} style={{ inset: 0 }} />
    {open && <div className="dropdown-menu" role="listbox" aria-label={label}>
      {options.map((option, i) => <button type="button" role="option" aria-selected={i === 0} autoFocus={i === 0} key={option} onClick={() => { setOpen(false); root.current?.querySelector('button')?.focus(); }}>{option}</button>)}
    </div>}
  </div>;
}

function ImageView({ camera = false }: { camera?: boolean }) {
  return <section className="panel camera-view" aria-label="相机画面">
    <Text x={20} y={20} size={20} medium tone="ink-90">相机画面</Text>
    {camera ? <><Box x={20} y={60} w={1368} h={724} kind="camera-empty" /><Asset name="imgCameraOff" x={631} y={349} w={146} h={146} /></> : <Asset name="imgImageCalibration" x={20} y={60} w={1368} h={724} />}
  </section>;
}

function ActionVisual({ x, y, w = 180, text, icon, kind }: { x: number; y: number; w?: number; text: string; icon: string; kind: string }) {
  const contentWidth = text.length * 16 + 23;
  const offset = (w - contentWidth) / 2;
  const size = icon === 'imgPlus' ? 22 : icon === 'imgCheckSmall' ? 18 : icon === 'imgClose' ? 14 : 16;
  const inset = icon === 'imgPlus' ? -3 : icon === 'imgCheckSmall' ? -1 : icon === 'imgClose' ? 1 : 0;
  return <><Box x={x} y={y} w={w} h={36} kind={kind} /><Asset name={icon} x={x + offset + inset} y={y + (36 - size) / 2} w={size} h={size} /><Text x={x + offset + 23} y={y + 7} tone={kind === 'secondary' ? 'blue' : 'white'}>{text}</Text></>;
}

function ImageControls({ correction, onFailureDetails }: { correction: Correction; onFailureDetails: (kind: 'arc' | 'perspective') => void }) {
  const expanded = correction !== 'none';
  const perspectiveY = perspectiveOffset(correction);
  return <>
    <section className="panel image-controls" style={{ height: expanded ? 319 : 297 }}>
      <Text x={24} y={14} size={20} medium>畸变矫正</Text><Box x={14} y={18} w={3} h={19} kind="title-marker" />
      <ActionVisual x={14} y={54} text="弧线" icon="imgPlus" kind="primary" /><ActionVisual x={202} y={54} text="清空" icon="imgClose" kind="secondary" />
      <ActionVisual x={14} y={98} text="撤回" icon="imgRefresh" kind="secondary" /><ActionVisual x={202} y={98} text="矫正" icon="imgCheckSmall" kind="success" />
      {correction === 'arc' && <><Asset name="imgCorrectionPass" x={161} y={145} w={14} h={14} /><Text x={179} y={142} size={14} tone="green">矫正通过</Text></>}
      {correction === 'arc-failed' && <button type="button" className="correction-failure" aria-label="畸变矫正失败，查看详情" onClick={() => onFailureDetails('arc')} style={position({ x: 126, y: 142, w: 144, h: 20 })}><Asset name="imgSaveError" x={0} y={3} w={14} h={14} /><Text x={18} y={0} size={14} tone="red">矫正失败，查看详情</Text></button>}
      <Box x={14} y={perspectiveY - 15} w={368} h={1} kind="divider" />
      <Text x={24} y={perspectiveY} size={20} medium>透视变换</Text><Box x={14} y={perspectiveY + 6} w={3} h={19} kind="title-marker" />
      <ActionVisual x={14} y={perspectiveY + 40} text="点" icon="imgPlus" kind="primary" /><ActionVisual x={202} y={perspectiveY + 40} text="清空" icon="imgClose" kind="secondary" />
      <ActionVisual x={14} y={perspectiveY + 84} text="撤回" icon="imgRefresh" kind="secondary" /><ActionVisual x={202} y={perspectiveY + 84} text="矫正" icon="imgCheckSmall" kind="success" />
      {correction === 'perspective' && <><Asset name="imgCorrectionPass" x={161} y={288} w={14} h={14} /><Text x={179} y={285} size={14} tone="green">矫正通过</Text></>}
      {correction === 'perspective-failed' && <button type="button" className="correction-failure" aria-label="透视矫正失败，查看详情" onClick={() => onFailureDetails('perspective')} style={position({ x: 126, y: 292, w: 144, h: 20 })}><Asset name="imgSaveError" x={0} y={3} w={14} h={14} /><Text x={18} y={0} size={14} tone="red">矫正失败，查看详情</Text></button>}
    </section>
    <section className="panel reference-panel" style={{ top: expanded ? 587 : 565 }}>
      <Text x={24} y={14} size={20} medium>参考图片</Text><Box x={14} y={20} w={3} h={19} kind="title-marker" />
      <Asset name="imgImageReference" x={14} y={54} w={366} h={176} /><Text x={169} y={236} size={14} tone="muted">查看图片</Text>
    </section>
  </>;
}

const cameraFields = [
  { label: '设备ID', values: ['DEMO-CAM-01'] },
  { label: '摄像头IP', values: ['192.168.1.100'] },
  { label: '码率', values: ['2048 kbps', '4096 kbps', '8192 kbps'] },
  { label: '帧率', values: ['25', '30'] },
  { label: '帧率上限', values: ['30', '60'] },
  { label: '分辨率', values: ['1920×1080', '1280×720'] },
  { label: '强光抑制', values: ['关闭', '开启'] },
];

function CameraSettings({ values, onChange, feedback }: { values: Record<string, string>; onChange: (key: string, value: string) => void; feedback: SaveFeedback }) {
  return <section className="panel camera-settings">
    <Text x={24} y={14} size={20} medium>选择目标相机</Text><Box x={14} y={18} w={3} h={19} kind="title-marker" />
    <Box x={14} y={54} w={368} h={40} kind="select" /><Text x={28} y={63} tone="ink-80">集卡引导入口侧相机</Text><Asset name="imgFrame13" x={352} y={69} w={16} h={10} />
    <Box x={14} y={102} w={368} h={1} kind="divider" />
    {cameraFields.map((field, i) => <div key={field.label}>
      <Text x={14} y={120 + 48 * i} medium>{field.label}</Text>
      <Box x={106} y={111 + 48 * i} w={276} h={40} kind="camera-setting-field" />
      <Asset name="imgFrame13" x={352} y={126 + 48 * i} w={16} h={10} />
      <select className="camera-setting-select" aria-label={field.label} value={values[field.label] ?? ''} onChange={e => onChange(field.label, e.target.value)} style={position({ x: 106, y: 111 + 48 * i, w: 276, h: 40 })}>
        <option value="" disabled hidden>请选择</option>{field.values.map(v => <option key={v}>{v}</option>)}
      </select>
    </div>)}
    <Box x={262} y={455} w={120} h={36} kind="success" /><Text x={290} y={462} tone="white">保存配置</Text>
    {feedback === 'success' && <div className="save-feedback" role="status" aria-label="保存结果">
      <Asset name="imgSaveSuccess" x={262} y={500} w={14} h={14} node="915:4342" />
      <Text x={280} y={497} size={14} tone="green">保存成功</Text>
    </div>}
    {feedback === 'error' && <div className="save-feedback" role="alert" aria-label="保存结果">
      <Asset name="imgSaveError" x={252} y={500} w={14} h={14} node="914:3661" />
      <Text x={270} y={497} size={14} tone="red">存在未填写的配置</Text>
    </div>}
  </section>;
}

function LoginForm({ onSuccess }: { onSuccess: () => void }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const usernameInput = useRef<HTMLInputElement>(null);
  const passwordInput = useRef<HTMLInputElement>(null);
  return <form className={`panel login-panel ${error ? 'login-error' : ''}`} aria-label="身份确认" noValidate onSubmit={e => {
    e.preventDefault();
    if (!username.trim()) { setError('用户名错误'); usernameInput.current?.focus(); return; }
    if (!password.trim()) { setError('请输入密码'); passwordInput.current?.focus(); return; }
    // Frontend prototype only: no credentials are transmitted or persisted.
    setPassword(''); setUsername(''); onSuccess();
  }}>
    <Text x={24} y={14} size={20} medium>身份确认</Text>
    <Box x={14} y={18} w={3} h={19} kind="title-marker" />
    <Box x={90} y={54} w={292} h={40} kind="select" />
    <Box x={90} y={102} w={292} h={40} kind="select" />
    <label className="login-label" htmlFor="login-username" style={position({ x: 14, y: 63 })}>用户名</label>
    <label className="login-label" htmlFor="login-password" style={position({ x: 14, y: 111 })}>密码</label>
    <input ref={usernameInput} id="login-username" className="login-input" autoComplete="off" placeholder="请输入" value={username} onChange={e => { setUsername(e.target.value); setError(''); }} aria-describedby={error ? 'login-validation' : undefined} style={position({ x: 90, y: 54, w: 292, h: 40 })} />
    <input ref={passwordInput} id="login-password" className="login-input" type="password" autoComplete="off" placeholder="请输入" value={password} onChange={e => { setPassword(e.target.value); setError(''); }} aria-describedby={error ? 'login-validation' : undefined} style={position({ x: 90, y: 102, w: 292, h: 40 })} />
    <button className="login-submit" type="submit" style={position({ x: 262, y: 158, w: 120, h: 36 })}>登录</button>
    {error && <><Asset name="imgLoginError" x={262} y={203} w={14} h={14} /><p id="login-validation" className="login-validation" role="alert" style={position({ x: 280, y: 200 })}>{error}</p></>}
  </form>;
}

function Steps({ y, camera, previous, next, nextDisabled = false }: { y: number; camera?: boolean; previous: () => void; next: () => void; nextDisabled?: boolean }) {
  return <section className="step-navigation" aria-label="配置步骤" style={{ top: y }}>
    {!camera && <button type="button" className="wizard-step wizard-previous" onClick={previous}>上一步</button>}
    <button type="button" className="wizard-step wizard-next" disabled={nextDisabled} title={nextDisabled ? '请先保存相机配置' : undefined} onClick={next}>下一步</button>
  </section>;
}

function MarkSurface({ mode, points, onPoint }: { mode: MarkMode; points: Point[]; onPoint: (point: Point) => void }) {
  const addPoint = (e: MouseEvent<HTMLDivElement>) => {
    if (!mode) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const scale = Math.max(rect.width / 1368, rect.height / 724);
    const offsetX = (1368 * scale - rect.width) / 2;
    const offsetY = (724 * scale - rect.height) / 2;
    onPoint({ x: Math.round((e.clientX - rect.left + offsetX) / scale), y: Math.round((e.clientY - rect.top + offsetY) / scale) });
  };
  const xy = points.map(p => `${p.x},${p.y}`).join(' ');
  return <div className={`mark-surface ${mode ? 'marking' : ''}`} aria-label="相机标定画布" onClick={addPoint}>
    <svg width="1368" height="724" viewBox="0 0 1368 724" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      {mode === 'arc' && points.length === 3 ? <path d={`M${points[0].x},${points[0].y} Q${points[1].x},${points[1].y} ${points[2].x},${points[2].y}`} /> : points.length > 1 && <polyline points={xy + (points.length === 4 ? ` ${points[0].x},${points[0].y}` : '')} />}
      {points.map((p, i) => <g key={i}><circle cx={p.x} cy={p.y} r="7" /><text x={p.x + 12} y={p.y - 10}>{i + 1}</text></g>)}
    </svg>
  </div>;
}

function Modal({ children, close }: { children: ReactNode; close: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => { const n = dialog.current!; n.showModal(); return () => { n.close(); }; }, []);
  return <dialog className="reference-dialog" ref={dialog} onCancel={close} onClick={e => { if (e.target === e.currentTarget) close(); }}>
    <div><button autoFocus type="button" className="dialog-close" aria-label="关闭参考图片" onClick={close}><img src="./assets/imgClose.svg" width="24" height="24" alt="" /></button>{children}</div>
  </dialog>;
}

export default function Demo() {
  const [stage, setStage] = useState<Stage>('login');
  const [navigationExpanded, setNavigationExpanded] = useState(false);
  const [complete, setComplete] = useState(false);
  const [values, setValues] = useState<ParameterValues>(emptyValues);
  const [mode, setMode] = useState<MarkMode>(null);
  const [locks, setLocks] = useState<Point[]>([]);
  const [arc, setArc] = useState<Point[]>([]);
  const [perspective, setPerspective] = useState<Point[]>([]);
  const [correction, setCorrection] = useState<Correction>('none');
  const [cameraConfig, setCameraConfig] = useState<Record<string, string>>({});
  const [saveFeedback, setSaveFeedback] = useState<SaveFeedback>('idle');
  const [message, setMessage] = useState('');
  const [modal, setModal] = useState(false);
  const [failureDetails, setFailureDetails] = useState<'arc' | 'perspective' | null>(null);
  const [assistantView, setAssistantView] = useState<AssistantView>('closed');
  const [showAssistantHint, setShowAssistantHint] = useState(false);
  const assistantHintShown = useRef(false);
  const changeAssistant = useCallback((view: AssistantView) => {
    setAssistantView(view);
    if (view !== 'closed') { setShowAssistantHint(false); setMode(null); setMessage(''); }
  }, []);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const notify = (text: string) => { setMessage(text); if (toastTimer.current) clearTimeout(toastTimer.current); toastTimer.current = setTimeout(() => setMessage(''), 4000); };
  useEffect(() => () => { if (toastTimer.current) clearTimeout(toastTimer.current); }, []);
  useEffect(() => { const escape = (e: KeyboardEvent) => { if (e.key === 'Escape') { setMode(null); setMessage(''); } }; document.addEventListener('keydown', escape); return () => document.removeEventListener('keydown', escape); }, []);
  const go = (target: Stage) => { setStage(target); setMode(null); setMessage(''); setModal(false); setShowAssistantHint(false); setAssistantView('closed'); };
  const loginSuccess = () => {
    go('camera');
    if (!assistantHintShown.current) { setShowAssistantHint(true); assistantHintShown.current = true; }
  };
  const beginLocks = () => { setMode('locks'); setComplete(false); setValues(emptyValues); if (locks.length === 4) setLocks([]); notify('请在相机画面中依次标定4个锁孔位置；Esc 退出标定。'); };
  const activePoints = stage === 'system' ? locks : mode === 'arc' || (!mode && correction.startsWith('arc')) ? arc : perspective;
  const setActivePoints = stage === 'system' ? setLocks : mode === 'arc' ? setArc : setPerspective;
  const addPoint = (p: Point) => {
    const limit = mode === 'arc' ? 3 : 4;
    if (activePoints.length >= limit) { notify(`已标定${limit}个位置，可撤回或清空后重新标定。`); return; }
    setActivePoints([...activePoints, p]);
  };
  const generate = () => {
    if (locks.length !== 4) { notify('请先标定4个锁孔位置，再生成位置参数。'); return; }
    // Local demo geometry only. Device calibration requires the real calibration service.
    const x = Math.round(locks.reduce((a, p) => a + p.x, 0) / 4);
    const y = Math.round(locks.reduce((a, p) => a + p.y, 0) / 4);
    setValues({ center: `（${x}，${y}）`, ratio: '1.00', trolley: `（${x}，${y}）`, grab: `（${locks[3].x}，${locks[3].y}）`, result: String(x) });
    setComplete(true); setMode(null); notify('Demo位置参数已生成；仅供交互演示，不用于现场设备。');
  };
  const screenshot = async () => {
    try {
      const source = new Image(); source.src = stage === 'system' ? './assets/imgRectangle293.png' : './assets/imgImageCalibration.png'; await source.decode();
      const canvas = document.createElement('canvas'); canvas.width = 1368; canvas.height = 724;
      const ctx = canvas.getContext('2d')!; ctx.drawImage(source, 0, 0, 1368, 724);
      ctx.strokeStyle = '#3370ff'; ctx.fillStyle = '#3370ff'; ctx.lineWidth = 2;
      for (const p of stage === 'system' ? locks : [...arc, ...perspective]) { ctx.beginPath(); ctx.arc(p.x, p.y, 7, 0, Math.PI * 2); ctx.stroke(); }
      const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/png')); if (!blob) throw new Error('生成截图失败');
      const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'camera-screenshot.png'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
      notify('画面截图已下载。');
    } catch { notify('截图失败，请重试。'); }
  };
  const correct = (kind: 'arc' | 'perspective') => {
    const valid = kind === 'arc' ? arc.length >= 3 : perspective.length >= 4;
    setCorrection(valid ? kind : kind === 'arc' ? 'arc-failed' : 'perspective-failed');
    setMode(null); setMessage('');
  };
  const imageExpanded = correction !== 'none';
  const py = perspectiveOffset(correction);
  return <main className="screen" data-navigation-expanded={navigationExpanded} data-stage={stage} data-node-id={stage === 'login' ? '914:3168' : stage === 'system' ? complete ? '915:5939' : '915:5438' : stage === 'image' ? correction === 'arc' ? '915:4411' : correction === 'perspective' ? '915:5286' : correction === 'arc-failed' ? '915:4918' : correction === 'perspective-failed' ? '915:4701' : '914:2162' : saveFeedback === 'success' ? '915:4275' : saveFeedback === 'error' ? '914:3584' : '914:3452'}>
    {stage === 'login' ? <><Progress step={0} /><ImageView camera /><LoginForm onSuccess={loginSuccess} /></> : stage === 'system' ? <SystemContent complete={complete} values={values} /> : <>
      <Progress step={stage === 'camera' ? 0 : 1} /><ImageView camera={stage === 'camera'} />
      {stage === 'image' ? <><CameraSelection /><ImageControls correction={correction} onFailureDetails={kind => { setMessage(''); setFailureDetails(kind); }} /><Steps y={imageExpanded ? 887 : 865} previous={() => go('camera')} next={() => { setComplete(false); setValues(emptyValues); setLocks([]); go('system'); }} /></> : <><CameraSettings values={cameraConfig} feedback={saveFeedback} onChange={(key, value) => { setCameraConfig(v => ({ ...v, [key]: value })); setSaveFeedback('idle'); }} /><Steps y={651} camera nextDisabled={saveFeedback !== 'success'} previous={() => {}} next={() => { if (saveFeedback === 'success') go('image'); }} /></>}
    </>}
    <Navigation expanded={navigationExpanded} stage={stage} assistantOpen={assistantView !== 'closed'} onToggle={() => setNavigationExpanded(value => !value)} configurationSelected={assistantView !== 'full'} onConfigurationClick={() => changeAssistant('closed')} onAssistantClick={() => changeAssistant(assistantView === 'closed' ? 'side' : 'closed')} /><Header />
    <Dropdown x={navigationExpanded ? 398 : 246} y={110} w={236} label="选择项目" options={['XXXX项目']} />
    {stage !== 'login' && <Dropdown x={1520} y={144} w={368} label="选择目标相机" options={['集卡引导入口侧相机']} />}
    {(stage === 'image' || stage === 'system') && <Hit x={1520} y={198} w={368} h={36} label="画面截图" action={screenshot} />}
    {stage === 'system' && <>
      <Dropdown x={1596} y={272} w={292} label="标定类型" options={['抓箱位置标定']} /><Dropdown x={1596} y={320} w={292} label="工况类型" options={['2.6m，单20尺作业']} />
      <Hit x={1520} y={469} w={180} h={36} label="添加锁孔标定点" action={beginLocks} />
      <Hit x={1708} y={469} w={180} h={36} label="清空锁孔标定点" action={() => { setLocks([]); setComplete(false); setValues(emptyValues); }} />
      <Hit x={1520} y={513} w={180} h={36} label="撤回锁孔标定点" action={() => { setLocks(p => p.slice(0, -1)); setComplete(false); setValues(emptyValues); }} />
      <Hit x={1708} y={513} w={180} h={36} label="生成位置参数" action={generate} />
      {complete && <Hit x={1520} y={766} w={368} h={36} label="此工况标定成功，通知现场" action={() => notify('Demo演示：已确认标定结果，未发送现场通知。')} />}
      <Steps y={complete ? 846 : 792} previous={() => go('image')} next={() => notify('当前Figma原型未提供LED与语音设置页面，演示到此步骤。')} />
    </>}
    {stage === 'image' && <>
      <Hit x={1520} y={312} w={180} h={36} label="添加畸变弧线" action={() => { setMode('arc'); setCorrection('none'); if (arc.length === 3) setArc([]); notify('依次点击画面中的3个位置绘制弧线。'); }} />
      <Hit x={1708} y={312} w={180} h={36} label="清空畸变弧线" action={() => { setArc([]); setCorrection('none'); setMode('arc'); }} />
      <Hit x={1520} y={356} w={180} h={36} label="撤回畸变弧线" action={() => { setArc(p => p.slice(0, -1)); setMode('arc'); setCorrection('none'); }} />
      <Hit x={1708} y={356} w={180} h={36} label="畸变矫正" action={() => correct('arc')} />
      <Hit x={1520} y={258 + py + 40} w={180} h={36} label="添加透视标定点" action={() => { setMode('perspective'); setCorrection('none'); if (perspective.length === 4) setPerspective([]); notify('依次点击画面中的4个透视标定位置。'); }} />
      <Hit x={1708} y={258 + py + 40} w={180} h={36} label="清空透视标定点" action={() => { setPerspective([]); setCorrection('none'); setMode('perspective'); }} />
      <Hit x={1520} y={258 + py + 84} w={180} h={36} label="撤回透视标定点" action={() => { setPerspective(p => p.slice(0, -1)); setCorrection('none'); setMode('perspective'); }} />
      <Hit x={1708} y={258 + py + 84} w={180} h={36} label="透视矫正" action={() => correct('perspective')} />
      <Hit x={1520} y={imageExpanded ? 641 : 619} w={366} h={202} label="查看参考图片" action={() => setModal(true)} />
    </>}
    {stage === 'camera' && <Hit x={1768} y={545} w={120} h={36} label="保存配置" action={() => setSaveFeedback(cameraFields.some(f => !cameraConfig[f.label]) ? 'error' : 'success')} />}
    {(stage === 'image' || stage === 'system') && <MarkSurface mode={mode} points={stage === 'system' ? locks : activePoints} onPoint={addPoint} />}
    {message && <div className="demo-toast" role="status">{message}</div>}
    {showAssistantHint && stage === 'camera' && assistantView === 'closed' && <AssistantHint open={() => changeAssistant('side')} />}
    <Assistant view={assistantView} changeView={changeAssistant} navigationExpanded={navigationExpanded} />
    {failureDetails && <CorrectionDialog kind={failureDetails} close={() => setFailureDetails(null)} report={() => { setFailureDetails(null); notify('Demo暂未接入故障上报服务。'); }} />}
    {modal && <Modal close={() => setModal(false)}><img className="reference-large" src="./assets/imgImageReference.png" alt="参考图片" width="1098" height="528" /></Modal>}
  </main>;
}
