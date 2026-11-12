import { useEffect, useRef, useState } from 'react';
import type { CSSProperties, PointerEvent } from 'react';
import { Text, position } from './App';
import './assistant.css';

export type AssistantView = 'closed' | 'side' | 'full';
const prompts = [
  '集卡引导定位系统透视矫正如何操作？',
  '40尺箱子室外标定需要采集哪几张图片？',
  '为什么畸变矫正不成功？',
  '哪些标定工况已完成，分析成功率',
];
const recent = ['大车防撞标定流程，如果出现标定', '相机连接失败怎么办？'];

function IconButton({ label, name, x, y, w, h, onClick, expanded }: { label: string; name: string; x: number; y: number; w: number; h: number; onClick: () => void; expanded?: boolean }) {
  return <button type="button" className="ai-icon-button" aria-label={label} aria-expanded={expanded} onClick={onClick} style={position({ x, y, w, h })}>
    <img src={`./assets/${name}.svg`} width={w} height={h} alt="" />
  </button>;
}

export function AssistantHint({ open }: { open: () => void }) {
  return <button type="button" className="assistant-hint" aria-label="AI助手，有问题随时问我" onClick={open} data-node-id="915:5745">
    <Text x={13.5} y={6.5} size={18}>AI助手</Text>
    <Text x={13.5} y={31.5} size={14} tone="ink-70">有问题随时问我~</Text>
  </button>;
}


type FloatingRect = { x: number; y: number; w: number; h: number };
type ResizeDirection = 'n' | 'e' | 's' | 'w' | 'ne' | 'nw' | 'se' | 'sw';
const minWindow = { w: 420, h: 680 };
const resizeLabels: Record<ResizeDirection, string> = { n: '顶部', e: '右侧', s: '底部', w: '左侧', ne: '右上角', nw: '左上角', se: '右下角', sw: '左下角' };
const resizeCursors: Record<ResizeDirection, string> = { n: 'ns-resize', e: 'ew-resize', s: 'ns-resize', w: 'ew-resize', ne: 'nesw-resize', nw: 'nwse-resize', se: 'nwse-resize', sw: 'nesw-resize' };
function resizeRect(rect: FloatingRect, dir: ResizeDirection, dx: number, dy: number, bounds: { left: number; top: number; right: number; bottom: number }): FloatingRect {
  let left = rect.x, right = rect.x + rect.w, top = rect.y, bottom = rect.y + rect.h;
  if (dir.includes('w')) left = Math.min(right - minWindow.w, Math.max(bounds.left, left + dx));
  if (dir.includes('e')) right = Math.max(left + minWindow.w, Math.min(bounds.right, right + dx));
  if (dir.includes('n')) top = Math.min(bottom - minWindow.h, Math.max(bounds.top, top + dy));
  if (dir.includes('s')) bottom = Math.max(top + minWindow.h, Math.min(bounds.bottom, bottom + dy));
  return { x: left, y: top, w: right - left, h: bottom - top };
}

export default function Assistant({ view, changeView, navigationExpanded }: { view: AssistantView; changeView: (view: AssistantView) => void; navigationExpanded: boolean }) {
  const [draft, setDraft] = useState('');
  const [notice, setNotice] = useState(false);
  const [searching, setSearching] = useState(false);
  const [search, setSearch] = useState('');
  const [historyCollapsed, setHistoryCollapsed] = useState(false);
  const [floating, setFloating] = useState<FloatingRect>({ x: 1394, y: 164, w: 478, h: 868 });
  const resize = useRef<{ start: FloatingRect; dir: ResizeDirection | 'move'; x: number; y: number; pointer: number; scale: number; cursor: string; selection: string; bounds: { left: number; top: number; right: number; bottom: number } } | null>(null);
  const input = useRef<HTMLTextAreaElement>(null);
  const firstControl = useRef<HTMLDivElement>(null);
  const stopResize = () => {
    if (!resize.current) return;
    document.documentElement.style.cursor = resize.current.cursor;
    document.body.style.userSelect = resize.current.selection;
    resize.current = null;
  };
  useEffect(() => () => stopResize(), []);
  useEffect(() => {
    if (view !== 'side') stopResize();
    if (view === 'closed') return;
    const escape = (e: KeyboardEvent) => { if (e.key === 'Escape') changeView('closed'); };
    document.addEventListener('keydown', escape);
    firstControl.current?.querySelector<HTMLButtonElement>('button:not([data-drag])')?.focus({ preventScroll: true });
    return () => document.removeEventListener('keydown', escape);
  }, [view, changeView]);
  const getBounds = () => {
    const screen = firstControl.current?.closest('main');
    return { left: navigationExpanded ? 240 : 88, top: 90, right: (screen?.clientWidth ?? 1920) - 18, bottom: (screen?.clientHeight ?? 1080) - 18 };
  };
  useEffect(() => {
    if (view !== 'side') return;
    stopResize();
    const bounds = getBounds();
    setFloating(rect => ({ ...rect, x: Math.max(bounds.left, Math.min(bounds.right - rect.w, rect.x)), y: Math.max(bounds.top, Math.min(bounds.bottom - rect.h, rect.y)) }));
  }, [navigationExpanded, view]);
  const beginResize = (e: PointerEvent<HTMLButtonElement>, dir: ResizeDirection | 'move') => {
    if (e.button !== 0 || resize.current) return;
    e.preventDefault(); e.stopPropagation();
    resize.current = { start: floating, dir, x: e.clientX, y: e.clientY, pointer: e.pointerId, scale: (() => { const screen = firstControl.current?.closest('main'); return screen ? screen.getBoundingClientRect().width / screen.clientWidth : 1; })(), cursor: document.documentElement.style.cursor, selection: document.body.style.userSelect, bounds: getBounds() };
    document.documentElement.style.cursor = dir === 'move' ? 'grabbing' : resizeCursors[dir]; document.body.style.userSelect = 'none';
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const moveResize = (e: PointerEvent<HTMLButtonElement>) => {
    const active = resize.current;
    if (active?.pointer === e.pointerId) {
      const dx = (e.clientX - active.x) / active.scale, dy = (e.clientY - active.y) / active.scale;
      setFloating(active.dir === 'move' ? { ...active.start, x: Math.max(active.bounds.left, Math.min(active.bounds.right - active.start.w, active.start.x + dx)), y: Math.max(active.bounds.top, Math.min(active.bounds.bottom - active.start.h, active.start.y + dy)) } : resizeRect(active.start, active.dir, dx, dy, active.bounds));
    }
  };
  const endResize = (e: PointerEvent<HTMLButtonElement>) => {
    stopResize();
    if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
  };
  const choosePrompt = (text: string) => { setDraft(text); setNotice(false); input.current?.focus({ preventScroll: true }); };
  const newChat = () => { setDraft(''); setNotice(false); input.current?.focus({ preventScroll: true }); };
  if (view === 'closed') return null;
  const full = view === 'full';
  const floatingStyle = { left: floating.x, top: floating.y, width: floating.w, height: floating.h, '--assistant-height': `${floating.h}px` } as CSSProperties;
  return <div className={full ? 'assistant-full' : 'assistant-floating'} style={full ? undefined : floatingStyle} id="ai-assistant" ref={firstControl} data-history-collapsed={historyCollapsed} data-min-width={minWindow.w} data-min-height={minWindow.h} data-node-id={full ? '914:4025' : '914:3977'}>
    {full && !historyCollapsed && <aside className="panel assistant-history" aria-label="AI助手最近记录" id="assistant-history">
      <Text x={20} y={20} size={22} medium tone="ink-90">AI助手</Text>
      <IconButton name="imgAiHistoryToggle" x={234} y={25} w={20} h={20} label="收起记录栏" expanded onClick={() => setHistoryCollapsed(true)} />
      <IconButton name="imgAiSearch" x={201} y={26} w={20} h={20} label="搜索最近记录" onClick={() => setSearching(!searching)} />
      {searching ? <input autoFocus className="assistant-search" aria-label="搜索记录" placeholder="搜索记录" value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => { if (e.key === 'Escape') { e.stopPropagation(); setSearching(false); } }} /> : <Text x={20} y={67} size={18} tone="muted">最近记录</Text>}
      {recent.map((text, i) => (!searching || text.includes(search)) && <button key={text} className="assistant-recent" type="button" onClick={() => choosePrompt(text)} style={position({ x: 20, y: 100 + i * 42, w: 234, h: 38 })}>{text}</button>)}
    </aside>}
    <section className={full ? `assistant-full-panel ${historyCollapsed ? 'history-collapsed' : ''}` : 'assistant-side-panel'} aria-label="AI助手">
      <div className="assistant-glow" aria-hidden="true" />
      {!full && <button type="button" className="assistant-drag-handle" data-drag aria-label="拖动AI窗口" tabIndex={-1} onPointerDown={e => beginResize(e, 'move')} onPointerMove={moveResize} onPointerUp={endResize} onPointerCancel={endResize} onLostPointerCapture={stopResize} />}
      {full ? <>
        {historyCollapsed && <IconButton name="imgAiHistoryToggle" x={25} y={25} w={20} h={20} label="展开记录栏" expanded={false} onClick={() => setHistoryCollapsed(false)} />}
        <IconButton name="imgAiFullNew" x={historyCollapsed ? 65 : 25} y={25} w={20} h={20} label="新建对话" onClick={newChat} />
      </> : <div className="assistant-side-tools">
        <IconButton name="imgAiExpand" x={0} y={0} w={26} h={26} label="展开AI助手" onClick={() => changeView('full')} />
        <IconButton name="imgAiNew" x={40} y={2} w={20} h={20} label="新建对话" onClick={newChat} />
        <div className="assistant-tools-divider" />
        <IconButton name="imgAiClose" x={79.3335} y={4.3305} w={16} h={16} label="关闭AI助手" onClick={() => changeView('closed')} />
      </div>}
      <div className="assistant-welcome">
        <img className="assistant-brand" src={`./assets/${full ? 'imgAiLogoFull' : 'imgAiLogoSide'}.svg`} width={full ? 78 : 58} height={full ? 78 : 58} alt="" />
        <h2>Hi，有什么可以帮到你？</h2>
        <p className="assistant-subtitle">全新AI助手能力上线，有问题问AI，高效解决！</p>
        <div className="assistant-prompts">{prompts.map((text, i) => <button key={text} type="button" className="assistant-prompt" aria-label={text} onClick={() => choosePrompt(text)}>
          <img src={`./assets/${i === 3 ? 'imgAiChart' : 'imgAiQuestion'}.svg`} width={16} height={16} alt="" /><span>{text}</span>
        </button>)}</div>
      </div>
      <form className={full ? 'assistant-compose assistant-compose-full' : 'assistant-compose'} aria-label="AI对话输入" onSubmit={e => { e.preventDefault(); if (draft.trim()) setNotice(true); }}>
        <textarea ref={input} aria-label="AI对话内容" placeholder="请输入内容，开启对话" value={draft} onChange={e => { setDraft(e.target.value); setNotice(false); }} onKeyDown={e => {
          if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); if (draft.trim()) setNotice(true); }
        }} />
        <button className="ai-icon-button assistant-send" aria-label="发送消息" type="submit" disabled={!draft.trim()}><img src={`./assets/${full ? 'imgAiSendFull' : 'imgAiSendSide'}.svg`} alt="" width={full ? 38 : 24} height={full ? 38 : 24} /></button>
      </form>
      <p className={`assistant-disclaimer ${full ? 'assistant-disclaimer-full' : ''}`} role={notice ? 'status' : undefined}>{notice ? '交互演示暂未接入AI服务' : '内容由 AI 生成，仅供参考'}</p>
    </section>
    {!full && (Object.keys(resizeLabels) as ResizeDirection[]).map(dir => <button key={dir} type="button" className={`assistant-resize assistant-resize-${dir}`} data-resize={dir} aria-label={`调整AI窗口${resizeLabels[dir]}尺寸`} onPointerDown={e => beginResize(e, dir)} onPointerMove={moveResize} onPointerUp={endResize} onPointerCancel={endResize} onLostPointerCapture={stopResize} onKeyDown={e => {
      const delta = e.shiftKey ? 20 : 10;
      const dx = e.key === 'ArrowLeft' ? -delta : e.key === 'ArrowRight' ? delta : 0;
      const dy = e.key === 'ArrowUp' ? -delta : e.key === 'ArrowDown' ? delta : 0;
      if (dx || dy) { e.preventDefault(); setFloating(r => resizeRect(r, dir, dx, dy, getBounds())); }
    }} />)}
  </div>;
}
