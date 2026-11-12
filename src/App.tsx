import type { CSSProperties, ReactNode } from 'react';

// The Figma containers use layoutMode NONE. Coordinates stay in their local frames.
type Positioned = { x: number; y: number; w?: number; h?: number };
const position = ({ x, y, w, h }: Positioned): CSSProperties => ({ left: x >= 1500 ? `calc(${x}px + var(--extra-width, 0px))` : x, top: y, width: w, height: h });

function Asset({ name, x, y, w, h, node }: Positioned & { name: string; node?: string }) {
  const ext = ['imgRectangle293', 'img122'].includes(name) || name.startsWith('imgImage') ? 'png' : 'svg';
  return <img className="asset" src={`./assets/${name}.${ext}`} alt="" width={w} height={h} style={position({ x, y, w, h })} data-node-id={node} />;
}

function Text({ x, y, w, size = 16, medium = false, tone = '', children, center = false }: Positioned & {
  size?: number; medium?: boolean; tone?: string; children: ReactNode; center?: boolean;
}) {
  return <p className={`text text-${size} ${medium ? 'medium' : ''} ${tone} ${center ? 'center' : ''}`} style={position({ x, y, w })}>{children}</p>;
}

function Box({ x, y, w, h, kind = '' }: Positioned & { kind?: string }) {
  return <div className={`box ${kind}`} style={position({ x, y, w, h })} />;
}

function Header() {
  return <header className="header" data-node-id="915:6072">
    <Asset name="img122" x={23} y={19} w={164} h={34} node="915:6074" />
    <Text x={1791} y={23.5} size={18} medium>中/EN</Text>
    <Asset name="imgEllipse1" x={1859} y={17} w={38} h={38} />
    <Asset name="imgEllipse12" x={1873} y={26} w={10} h={10} />
    <Asset name="imgRectangle274" x={1867} y={38} w={22} h={8} />
  </header>;
}

function Navigation({ configurationSelected = true, expanded, stage, assistantOpen, onToggle, onConfigurationClick, onAssistantClick }: {
  configurationSelected?: boolean; expanded: boolean; stage: 'login' | 'camera' | 'image' | 'system'; assistantOpen: boolean;
  onToggle: () => void; onConfigurationClick: () => void; onAssistantClick: () => void;
}) {
  const lowerOffset = expanded ? 325 : 0;
  const submenus = ['相机设置', '画面标定', '系统参数设置', 'LED与语音设置', '超级管理员', '备份管理'];
  const currentStep = stage === 'system' ? 2 : stage === 'image' ? 1 : 0;
  return <aside id="task-navigation" className={`navigation ${expanded ? 'navigation-expanded' : ''}`} aria-label="导航" data-node-id={expanded ? '914:2076' : '915:6050'}>
    {configurationSelected && <Box x={expanded ? 6 : 10} y={288} w={expanded ? 211 : 50} h={50} kind="navigation-selected" />}
    <Asset name="imgImage20260914T16592901011" x={23} y={31} w={24} h={24} node="915:6059" />
    <Asset name="imgFrame1" x={23} y={85} w={24} h={24} node="915:6054" />
    <Asset name="imgImage20260914T1559383961" x={22} y={138} w={26} h={26} node="915:6052" />
    <Asset name="imgImage20260914T1628454591" x={23} y={193} w={24} h={24} node="915:6056" />
    <Asset name="imgImage20260914T1745274181" x={23} y={247} w={24} h={24} node="915:6057" />
    <Asset name={configurationSelected ? 'imgImage20260914T1826171341' : 'imgImageConfigurationInactive'} x={23} y={301} w={24} h={24} node={configurationSelected ? '915:6058' : '914:4040'} />
    {expanded && <>
      {['GNSS', '视觉纠偏', '大车防撞', '防吊起', 'OCR识别'].map((label, i) => <div key={label}><Text x={58} y={32 + 54 * i} tone="ink-60">{label}</Text><Asset name="imgNavigationChevron" x={190} y={35 + 54 * i} w={10} h={16} /></div>)}
      <Text x={58} y={302} medium={configurationSelected} tone={configurationSelected ? 'white' : 'ink-60'}>集卡引导定位</Text>
      {configurationSelected && <Asset name="imgNavigationSelectedChevron" x={187} y={308} w={16} h={10} />}
      {submenus.map((label, i) => <Text key={label} x={58} y={356 + 54 * i} medium={configurationSelected && currentStep === i} tone={configurationSelected && currentStep === i ? 'blue' : 'ink-60'}>{label}</Text>)}
    </>}
    <button type="button" className="hit-target" aria-label="集卡引导定位" aria-current={configurationSelected ? 'page' : undefined} style={position({ x: expanded ? 6 : 10, y: 288, w: expanded ? 211 : 50, h: 50 })} onClick={onConfigurationClick} />
    <Asset name="imgFrame2" x={24} y={355 + lowerOffset} w={22} h={22} node="915:6060" />
    <Asset name="imgImage20260914T1846550281" x={23} y={408 + lowerOffset} w={24} h={24} node="915:6062" />
    <Asset name="imgImage20260914T1849527171" x={23} y={462 + lowerOffset} w={24} h={24} node="915:6063" />
    <Asset name="imgFrame3" x={22.5} y={515.5 + lowerOffset} w={25} h={25} node="915:6064" />
    {expanded && ['电子围栏', '2D防撞', '3D防撞', '后台管理'].map((label, i) => <div key={label}><Text x={58} y={680 + 54 * i} tone="ink-60">{label}</Text><Asset name="imgNavigationChevron" x={188} y={683 + 54 * i} w={10} h={16} /></div>)}
    <div className="navigation-ai-entry">
      <Asset name="imgSubtract1" x={6} y={6} w={26} h={26} node="915:6066" />
      {expanded && <><Text x={42} y={8} tone="ink-60">AI助手</Text><Asset name="imgNavigationChevron" x={172} y={11} w={10} h={16} /></>}
      <button type="button" className="hit-target" aria-label="AI助手" aria-controls="ai-assistant" aria-expanded={assistantOpen} style={{ inset: 0 }} onClick={onAssistantClick} />
    </div>
    <button type="button" className="navigation-toggle" aria-label={expanded ? '收起导航栏' : '展开导航栏'} aria-expanded={expanded} aria-controls="task-navigation" onClick={onToggle}>
      <img src="./assets/imgNavigationToggle.svg" width="20" height="74" alt="" />
    </button>
  </aside>;
}

function Progress({ step = 2 }: { step?: 0 | 1 | 2 }) {
  const labels = ['相机设置', '画面标定', '系统参数设置', 'LED与语音设置', '配置完成'];
  return <section className="panel progress" aria-label="当前配置进度" data-node-id="915:5961">
    <div className="progress-heading">
      <h2>当前配置进度</h2>
      <div className="progress-project select"><span>XXXX项目</span><img src="./assets/imgFrame13.svg" width="16" height="10" alt="" /></div>
    </div>
    <div className="progress-flow"><div className="progress-steps" aria-label={`当前进度${step * 25}%`}>
      <div className="progress-line"><div className="progress-fill" style={{ width: `${step * 25}%` }} /></div>
      {labels.map((label, i) => <div className="progress-node" key={label} aria-current={i === step ? 'step' : undefined}>
        <div className="progress-dot">
          {i === 4 ? <>
            <Asset name={step ? 'imgEllipse6' : 'imgProgressZeroRing'} x={0} y={0} w={40} h={40} />
            {step === 1 && <Asset name="imgQuarterArc" x={0} y={3.318359375} w={10.2294921875} h={32.44140625} />}
            {step === 2 && <Asset name="imgSubtract" x={0} y={0} w={20} h={40} />}
            <span className="progress-percentage">{step * 25}%</span>
          </> : i <= step ? <>
            <Asset name="imgEllipse3" x={5} y={5} w={30} h={30} />
            <Asset name={i < step ? 'imgCheckSmall1' : 'imgEllipse12'} x={i < step ? 12 : 15} y={i < step ? 12 : 15} w={i < step ? 16 : 10} h={i < step ? 16 : 10} />
          </> : <><Asset name="imgEllipse7" x={7} y={7} w={26} h={26} /><Asset name="imgEllipse10" x={16} y={16} w={8} h={8} /></>}
        </div>
        <span className={`progress-label ${i === step ? 'blue medium' : i === 4 ? '' : 'muted'}`}>{label}</span>
      </div>)}
    </div></div>
  </section>;
}

function CameraView() {
  return <section className="panel camera-view" aria-label="相机画面" data-node-id="915:5957">
    <Text x={20} y={20} size={20} medium tone="ink-90">相机画面</Text>
    <Asset name="imgRectangle293" x={20} y={60} w={1368} h={724} node="915:5960" />
  </section>;
}

function CameraSelection() {
  return <section className="panel camera-selection" aria-label="选择目标相机" data-node-id="915:5940">
    <Text x={24} y={14} size={20} medium>选择目标相机</Text>
    <Box x={14} y={54} w={368} h={40} kind="select" />
    <Text x={28} y={63} tone="ink-80">集卡引导入口侧相机</Text>
    <Asset name="imgFrame13" x={352} y={69} w={16} h={10} />
    <Box x={14} y={18} w={3} h={19} kind="title-marker" />
    <Box x={14} y={108} w={368} h={36} kind="primary" />
    <Text x={164} y={115} tone="white">画面截图</Text>
  </section>;
}

export type ParameterValues = { center: string; ratio: string; trolley: string; grab: string; result: string };

function Calibration({ complete, values }: { complete: boolean; values: ParameterValues }) {
  return <section className={`panel calibration ${complete ? "" : "calibration-pending"}`} aria-label="标定计算" data-node-id="915:5988">
    <Box x={90} y={14} w={292} h={40} kind="select" />
    <Box x={90} y={62} w={292} h={40} kind="select" />
    <Text x={104} y={24} size={14} tone="ink-80">抓箱位置标定</Text>
    <Text x={104} y={72} size={14} tone="ink-80">2.6m，单20尺作业</Text>
    <Asset name="imgFrame13" x={352} y={29} w={16} h={10} />
    <Asset name="imgFrame13" x={352} y={77} w={16} h={10} />
    <Text x={14} y={23} medium>标定类型</Text>
    <Text x={14} y={71} medium>工况类型</Text>
    <Text x={24} y={131} size={20} medium>标定计算</Text>
    <Box x={14} y={135} w={3} h={19} kind="title-marker" />
    <Box x={14} y={211} w={180} h={36} kind="primary" />
    <Box x={14} y={255} w={180} h={36} kind="secondary" />
    <Box x={202} y={211} w={180} h={36} kind="secondary" />
    {complete && <Box x={14} y={508} w={368} h={36} kind="outline" />}
    <Box x={202} y={255} w={180} h={36} kind="success" />
    {complete && <Text x={115} y={515} tone="blue">此工况标定成功，通知现场</Text>}
    <Box x={14} y={116} w={368} h={1} kind="divider" />
    <Box x={14} y={305} w={368} h={1} kind="divider" />
    <div className="control-label" style={position({ x: 76.5, y: 262, w: 55, h: 22 })}>
      <Text x={23} y={0} tone="blue">撤回</Text><Asset name="imgRefresh" x={0} y={3} w={16} h={16} />
    </div>
    <div className="control-label" style={position({ x: 264.5, y: 218, w: 55, h: 22 })}>
      <Text x={23} y={0} tone="blue">清空</Text><Asset name="imgClose" x={1} y={4} w={14} h={14} />
    </div>
    <Asset name="imgClose1" x={257} y={432} w={12} h={12} />
    <div className="control-label" style={position({ x: 232.5, y: 262, w: 119, h: 22 })}>
      <Asset name="imgCheckSmall" x={-1} y={2} w={18} h={18} /><Text x={23} y={0} tone="white">生成位置参数</Text>
    </div>
    <div className="control-label" style={position({ x: 84.5, y: 218, w: 39, h: 22 })}>
      <Asset name="imgPlus" x={-3} y={0} w={22} h={22} /><Text x={23} y={0} tone="white">点</Text>
    </div>
    <Box x={14} y={350} w={338} h={30} kind="field" />
    <Box x={14} y={422} w={108} h={30} kind="field" />
    <Box x={144} y={422} w={108} h={30} kind="field" />
    <Box x={274} y={422} w={108} h={30} kind="field" />
    <Box x={30} y={460} w={322} h={30} kind="field" />
    <Text x={14} y={320}>大车到位位置</Text>
    <Text x={14} y={392}>小车到位位置</Text>
    <input className="parameter-input" aria-label="大车中心像素" value={values.center} placeholder={complete ? "" : "大车中心像素"} readOnly style={position({ x: 14, y: 350, w: 337, h: 30 })} />
    <input className="parameter-input" aria-label="小车到位位置结果" value={values.result} placeholder={complete ? "" : "小车到位位置结果"} readOnly style={position({ x: 30, y: 460, w: 323, h: 30 })} />
    <Text x={24} y={159} w={358} size={14} tone="muted">在画面上标定当前工况的4个锁孔位置，系统自动生成位置参数。</Text>
    <Text x={364} y={358} size={14} tone="ink-80">PX</Text>
    <Text x={358} y={468} size={14} tone="ink-80">mm</Text>
    <input className="parameter-input" aria-label="集装箱像素比" value={values.ratio} placeholder={complete ? "" : "集装箱像素比"} readOnly style={position({ x: 14, y: 422, w: 108, h: 30 })} />
    <Asset name="imgPlus1" x={124} y={428} w={18} h={18} />
    <input className="parameter-input" aria-label="小车中心像素" value={values.trolley} placeholder={complete ? "" : "小车中心像素"} readOnly style={position({ x: 144, y: 422, w: 109, h: 30 })} />
    <input className="parameter-input" aria-label="箱槽小车位置" value={values.grab} placeholder={complete ? "" : "箱槽小车位置"} readOnly style={position({ x: 274, y: 422, w: 109, h: 30 })} />
    <div className="equals" style={position({ x: 14, y: 472, w: 10, h: 6 })}><i /><i /></div>
    {complete && <Asset name="imgFrame" x={89} y={516} w={20} h={20} />}
  </section>;
}

export default function SystemContent({ complete, values }: { complete: boolean; values: ParameterValues }) {
  return <>
    <CameraSelection /><CameraView /><Progress /><Calibration complete={complete} values={values} />
  </>;
}

export { Asset, Text, Box, Header, Navigation, CameraSelection, Progress, position };
