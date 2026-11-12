import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Asset, Box, Text, position } from './App';
import './correction-dialog.css';

type Kind = 'arc' | 'perspective';
const content = {
  arc: {
    title: '畸变矫正失败', node: '915:4665',
    rows: [
      { title: '标定不完整', titleY: 209, detailY: 243, detail: '标定区域较小，缺少图像左右或边缘的部分，镜头边角畸变无法拟合。', solution: '尽量选取完整、无遮挡的真实地面直线，完整标注。' },
      { title: '标定角度或位置不正确', titleY: 341, detailY: 375, detail: '标定点未参考实际是直线的目标进行标定。', solution: '直线参照物可以使用大车车道线、大车跑道与车道衔接的缝隙线等实际是直线的目标。' },
      { title: '矫正误差较大', titleY: 462, detailY: 496, detail: '标定画线覆盖不全、点位偏移。', solution: '再次进行矫正，或对照直线参考物使用多条直线进行矫正。' },
    ],
  },
  perspective: {
    title: '透视变换失败', node: '915:5233',
    rows: [
      { title: '区域选择错误', titleY: 209, detailY: 243, detail: '标定区域体现实际不是矩形区域或无法明确体现，可能存在较大的误差。', solution: '在选择角点坐标位置时，必须挑选明确能体现实际是矩形区域的位置，例如箱区贝位角。' },
      { title: '标定不完整', titleY: 329, detailY: 363, detail: '标定区域较小，缺少图像左右或边缘的部分，镜头边角畸变无法拟合。', solution: '选择进行透视的四个角点，需要尽可能最大的区域进行标注。' },
      { title: '地面箱区磨损或手动拉取绳子标注', titleY: 449, detailY: 483, detail: '地面十字标记磨损看不清，绳子摆放出现偏差，取出来的坐标存在物理误差。', solution: '再次进行矫正，或对照直线参考物使用多条直线进行矫正。' },
    ],
  },
};

export default function CorrectionDialog({ kind, close, report }: { kind: Kind; close: () => void; report: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const measure = () => Math.min(900 / 1062, (window.innerWidth - 48) / 1062, (window.innerHeight * 0.82) / 656);
  const [scale, setScale] = useState(measure);
  const data = content[kind];
  useEffect(() => {
    const element = dialog.current!;
    element.showModal();
    const resize = () => setScale(measure());
    window.addEventListener('resize', resize);
    return () => { element.close(); window.removeEventListener('resize', resize); };
  }, []);
  return createPortal(<dialog ref={dialog} className="correction-dialog" aria-label={data.title} onCancel={close} style={{ width: 1062 * scale, height: 656 * scale }}>
    <div className="correction-content" data-node-id={data.node} style={{ transform: `scale(${scale})` }}>
      <Asset name="imgCorrectionWarning" x={42} y={45} w={62} h={62} />
      <Text x={120} y={42} size={26} medium>{data.title}</Text>
      <Text x={120} y={82} size={20} tone="ink-70">抱歉，当前图像矫正未能成功，请检查以下可能的原因并尝试解决后重新操作。</Text>
      <Box x={42} y={130} w={978} h={438} kind="correction-reasons" />
      <Text x={64} y={152} size={24} medium tone="ink-80">可能出现的问题及解决方法</Text>
      {data.rows.map((row, i) => <div key={row.title}>
        <Box x={62} y={196 + i * 120} w={938} h={110} kind="correction-row" />
        <Text x={84} y={row.titleY} size={20} medium tone="blue">{row.title}</Text>
        <Text x={84} y={row.detailY} w={388} size={18} tone="ink-60">{row.detail}</Text>
        <Asset name="imgCorrectionArrow" x={509} y={229 + i * 120} w={44} h={44} />
        <Text x={590} y={226 + i * 120} w={388} size={18} tone="ink-80">{row.solution}</Text>
      </div>)}
      <button type="button" className="correction-report" style={position({ x: 316, y: 588, w: 208, h: 46 })} onClick={report}>上报故障</button>
      <button autoFocus type="button" className="correction-acknowledge" style={position({ x: 538, y: 588, w: 208, h: 46 })} onClick={close}>我知道了</button>
    </div>
  </dialog>, document.body);
}
