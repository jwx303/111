const { chromium } = require('playwright-core');
const assert = require('node:assert/strict');
const fs = require('node:fs');
(async () => {
 const browser = await chromium.launch({executablePath:process.env.BROWSER_PATH || '/usr/bin/chromium',headless:true,args:['--no-sandbox']});
 const results=[];const errors=[];
 for (const [width,height] of [[1996,1248],[1920,1200],[1920,1080],[1536,864],[1440,900],[1366,768],[1280,720],[1024,768],[2560,1440],[390,844]]) {
  const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:1});page.on('pageerror',e=>errors.push(e.message));
  await page.goto(process.env.DEMO_URL || 'http://localhost:5173');
  const button=name=>page.getByRole('button',{name,exact:true});
  const scale=Math.min(width/1920,height/1080);
  const checkSteps=async selector=>{const card=await page.locator(selector).boundingBox();const steps=await page.locator('.step-navigation').boundingBox();assert.ok(Math.abs(steps.y-card.y-card.height-30*scale)<1,'步骤按钮应位于卡片下方且保持间距');assert.ok(Math.abs(steps.x-card.x)<1 && Math.abs(steps.width-card.width)<1);const next=await button('下一步').boundingBox();assert.ok(Math.abs(next.width-192*scale)<1 && Math.abs(next.height-36*scale)<1);if(await button('上一步').count()){const previous=await button('上一步').boundingBox();assert.ok(Math.abs(previous.width-next.width)<1 && Math.abs(next.x-previous.x-previous.width-12*scale)<1);}};

  const checkProgress=async()=>{const card=await page.locator('.progress').boundingBox(),flow=await page.locator('.progress-steps').boundingBox(),line=await page.locator('.progress-line').boundingBox();const nodes=await page.locator('.progress-dot').evaluateAll(elements=>elements.map(e=>{const r=e.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2};}));assert.equal(nodes.length,5);assert.ok(flow.x>=card.x && flow.x+flow.width<=card.x+card.width+1 && flow.y>=card.y && flow.y+flow.height<=card.y+card.height+1);assert.ok(Math.abs(line.x-nodes[0].x)<1 && Math.abs(line.x+line.width-nodes[4].x)<1);for(let i=1;i<5;i++)assert.ok(Math.abs(nodes[i].x-nodes[i-1].x-(nodes[4].x-nodes[0].x)/4)<1);const before=await page.locator('.progress-heading').boundingBox();assert.ok(flow.y>before.y+before.height);};
  const rect=await page.locator('main').boundingBox();
  assert.ok(Math.abs(rect.width-width)<1 && Math.abs(rect.height-height)<1);
  assert.ok(rect.x>=-1 && rect.y>=-1 && rect.x+rect.width<=width+1 && rect.y+rect.height<=height+1);
  const checkLoginAlignment=async()=>{const progress=await page.locator('.progress').boundingBox(),login=await page.locator('.login-panel').boundingBox(),camera=await page.locator('.camera-view').boundingBox();assert.ok(Math.abs(progress.height-login.height)<1 && Math.abs(progress.y-login.y)<1,'配置进度与身份确认应同高对齐');assert.ok(Math.abs(camera.y-progress.y-progress.height-10*scale)<1,'相机区域应在对齐后的卡片下方');assert.ok(camera.y+camera.height<=height+1);};
  await checkLoginAlignment();await checkProgress();if([1996,1366].includes(width))await page.screenshot({path:`review/login-aligned-${width}.png`});await button('登录').click();await checkLoginAlignment();await checkProgress();if(width===1996)await page.screenshot({path:'review/login-error-aligned-1996.png'});
  await page.getByLabel('用户名',{exact:true}).fill('demo');await page.getByLabel('密码',{exact:true}).fill('demo');await button('登录').click();
  assert.equal(await page.locator('.camera-setting-select option:not([hidden])[value=""]').count(),0);assert.equal(await page.locator('.camera-setting-select option[hidden][disabled]').count(),7);
  for(const name of ['设备ID','摄像头IP','码率','帧率','帧率上限','分辨率','强光抑制'])await page.getByRole('combobox',{name,exact:true}).selectOption({index:1});
  await button('保存配置').click();await checkSteps('.camera-settings');await button('下一步').click();await checkSteps('.reference-panel');await checkProgress();await button('添加畸变弧线').click();
  const canvas=await page.locator('.mark-surface').boundingBox();await page.mouse.click(canvas.x+canvas.width/2,canvas.y+canvas.height/2);
  assert.ok(Math.abs(Number(await page.locator('.mark-surface circle').getAttribute('cx'))-684)<=Math.ceil(1/scale));assert.ok(Math.abs(Number(await page.locator('.mark-surface circle').getAttribute('cy'))-362)<=Math.ceil(1/scale));
  const mediaScale=Math.max(canvas.width/1368,canvas.height/724);const clickX=canvas.width*.25,clickY=canvas.height*.4;await page.mouse.click(canvas.x+clickX,canvas.y+clickY);const expectedX=(clickX+(1368*mediaScale-canvas.width)/2)/mediaScale,expectedY=(clickY+(724*mediaScale-canvas.height)/2)/mediaScale;const lastPoint=page.locator('.mark-surface circle').last();assert.ok(Math.abs(Number(await lastPoint.getAttribute('cx'))-expectedX)<=Math.ceil(1/mediaScale));assert.ok(Math.abs(Number(await lastPoint.getAttribute('cy'))-expectedY)<=Math.ceil(1/mediaScale));
  assert.equal(await page.locator('.camera-view > img').evaluate(i=>getComputedStyle(i).borderTopLeftRadius),'14px');
  const image=await page.locator('.camera-view > img').boundingBox();assert.ok(Math.abs(image.x-canvas.x)<1 && Math.abs(image.y-canvas.y)<1 && Math.abs(image.width-canvas.width)<1 && Math.abs(image.height-canvas.height)<1);
  await button('畸变矫正').click();await button('畸变矫正失败，查看详情').click();let failure=await page.locator('.correction-dialog').boundingBox();assert.ok(failure.x>=0 && failure.y>=0 && failure.x+failure.width<=width+1 && failure.y+failure.height<=height+1);await button('我知道了').click();
  await button('透视矫正').click();await button('透视矫正失败，查看详情').click();assert.equal(await page.getByRole('dialog',{name:'透视变换失败',exact:true}).count(),1);await page.keyboard.press('Escape');
  await button('AI助手').click();const panel=page.locator('.assistant-side-panel');const before=await panel.boundingBox();
  const handle=await page.locator('.assistant-drag-handle').boundingBox();await page.mouse.move(handle.x+100*scale,handle.y+24*scale);await page.mouse.down();await page.mouse.move(handle.x,handle.y+24*scale);await page.mouse.up();const after=await panel.boundingBox();assert.ok(Math.abs(after.x-(before.x-100*scale))<1);
  const edge=await page.locator('[data-resize="w"]').boundingBox();await page.mouse.move(edge.x+edge.width/2,edge.y+edge.height/2);await page.mouse.down();await page.mouse.move(edge.x+edge.width/2-50*scale,edge.y+edge.height/2);await page.mouse.up();const resized=await panel.boundingBox();assert.ok(Math.abs(resized.width-(after.width+50*scale))<1);
  await button('展开AI助手').click();assert.equal(await page.locator('.assistant-full').count(),1);await button('集卡引导定位').click();
  await button('查看参考图片').click();const dialog=await page.locator('dialog').boundingBox();assert.ok(dialog.x>=0 && dialog.y>=0 && dialog.x+dialog.width<=width+1 && dialog.y+dialog.height<=height+1);await button('关闭参考图片').click();
  await page.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.images].map(i=>i.decode()))});
  if([1996,1920,1366,1440,1024].includes(width))await page.screenshot({path:`review/responsive-${width}x${height}.png`});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth || document.documentElement.scrollHeight>innerHeight),false);
  await checkSteps('.reference-panel');await checkProgress();await button('下一步').click();await checkSteps('.calibration');await checkProgress();
  if([1996,1366].includes(width))await page.screenshot({path:`review/buttons-pending-${width}.png`});
  await button('添加锁孔标定点').click();const surface=await page.locator('.mark-surface').boundingBox();for(const [x,y]of [[.4,.4],[.6,.4],[.6,.6],[.4,.6]])await page.mouse.click(surface.x+surface.width*x,surface.y+surface.height*y);await button('生成位置参数').click();await checkSteps('.calibration');await checkProgress();
  if([1996,1366].includes(width))await page.screenshot({path:`review/buttons-complete-${width}.png`});
  await button('上一步').click();
  await page.evaluate(()=>{const root=document.getElementById('root');root.style.width='80%';root.style.height='70%'});await page.waitForTimeout(50);const nested=await page.locator('main').boundingBox();assert.ok(nested.width<=width*.8+1 && nested.height<=height*.7+1);await page.evaluate(()=>document.getElementById('root').removeAttribute('style'));await page.setViewportSize({width:1280,height:800});assert.equal(await page.locator('main').getAttribute('data-stage'),'image');
  results.push({width,height,scale,passed:true});await page.close();
 }
 assert.deepEqual(errors,[]);fs.writeFileSync('review/responsive-tests.json',JSON.stringify({passed:true,results,errors},null,2));console.log('10 viewports: proportional bounds, login, saved camera flow, marker coordinates, AI drag/resize/fullscreen, reference dialog and live resize passed.');await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
