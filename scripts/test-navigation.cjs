const {chromium}=require('playwright-core');
const assert=require('node:assert/strict');
const fs=require('node:fs');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.BROWSER_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox']});const results=[],errors=[];
 for(const [width,height]of [[1920,1080],[1092,716],[1440,900]]){
  const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:1});page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});await page.goto(process.env.DEMO_URL||'http://localhost:5173');
  const button=name=>page.getByRole('button',{name,exact:true}),nav=page.getByRole('complementary',{name:'导航',exact:true}),scale=Math.min(width/1920,height/1080);
  const hover=async()=>{const r=await nav.boundingBox();await page.mouse.move(r.x+r.width/2,r.y+20*scale)};
  const toggle=async name=>{await hover();await button(name).click()};
  assert.equal(await button('展开导航栏').evaluate(e=>getComputedStyle(e).opacity),'0');await hover();assert.equal(await button('展开导航栏').evaluate(e=>getComputedStyle(e).opacity),'1');const handle=await button('展开导航栏').boundingBox();assert.ok(Math.abs(handle.width-20*scale)<1 && Math.abs(handle.height-74*scale)<1);
  if(width===1920)await page.screenshot({path:'review/navigation-hover.png'});
  await button('展开导航栏').click();assert.ok(Math.abs((await nav.boundingBox()).width-222*scale)<1);assert.equal(await button('收起导航栏').getAttribute('aria-expanded'),'true');assert.equal(await nav.getByText('GNSS',{exact:true}).count(),1);assert.equal(await nav.getByText('系统参数设置',{exact:true}).count(),1);
  const card=await page.locator('.progress').boundingBox();assert.ok(Math.abs(card.x-240*scale)<1);await page.mouse.move(width-20,20);assert.equal(await button('收起导航栏').evaluate(e=>getComputedStyle(e).opacity),'0');
  await nav.getByText('画面标定',{exact:true}).click();assert.equal(await page.locator('main').getAttribute('data-stage'),'login');
  await page.getByLabel('用户名',{exact:true}).fill('demo');await page.getByLabel('密码',{exact:true}).fill('demo');await button('登录').click();
  for(const name of ['设备ID','摄像头IP','码率','帧率','帧率上限','分辨率','强光抑制'])await page.getByRole('combobox',{name,exact:true}).selectOption({index:1});await button('保存配置').click();await button('下一步').click();assert.equal(await page.locator('main').getAttribute('data-stage'),'image');assert.equal(await nav.locator('.text.blue').innerText(),'画面标定');
  await page.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.images].map(i=>i.decode()))});await page.screenshot({path:`review/navigation-expanded-${width}.png`});
  const image=await page.locator('.camera-view > img').boundingBox();const surface=await page.locator('.mark-surface').boundingBox();assert.ok(Math.abs(image.x-surface.x)<1 && Math.abs(image.width-surface.width)<1);assert.ok(surface.x>(await nav.boundingBox()).width);await button('添加畸变弧线').click();await page.mouse.click(surface.x+surface.width/2,surface.y+surface.height/2);assert.ok(Math.abs(Number(await page.locator('.mark-surface circle').getAttribute('cx'))-684)<3);
  await toggle('收起导航栏');assert.ok(Math.abs((await nav.boundingBox()).width-70*scale)<1);assert.equal(await page.locator('.mark-surface circle').count(),1);
  await button('AI助手').click();const h=await page.locator('.assistant-drag-handle').boundingBox();await page.mouse.move(h.x+80*scale,h.y+24*scale);await page.mouse.down();await page.mouse.move(-2000,h.y+24*scale);await page.mouse.up();await toggle('展开导航栏');const floating=await page.locator('.assistant-floating').boundingBox();assert.ok(floating.x>=240*scale-1,'浮窗必须避让展开后的导航栏');
  await button('展开AI助手').click();assert.ok(Math.abs((await page.locator('.assistant-full').boundingBox()).x-222*scale)<1);assert.equal(await page.locator('.navigation-selected').count(),0);await toggle('收起导航栏');assert.ok(Math.abs((await page.locator('.assistant-full').boundingBox()).x-70*scale)<1);await button('集卡引导定位').click();assert.equal(await page.locator('main').getAttribute('data-stage'),'image');await button('添加畸变弧线').click();assert.equal(await page.locator('.mark-surface circle').count(),1);
  await page.mouse.move(width-20,20);await page.keyboard.press('Tab');await button('展开导航栏').focus();assert.equal(await button('展开导航栏').evaluate(e=>getComputedStyle(e).opacity),'1');await page.keyboard.press('Enter');assert.equal(await button('收起导航栏').getAttribute('aria-expanded'),'true');
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);results.push({width,height,passed:true});await page.close();
 }
 assert.deepEqual(errors,[]);fs.writeFileSync('review/navigation-tests.json',JSON.stringify({passed:true,results,errors},null,2));console.log('Navigation hover, exact handle size, expand/collapse, inactive entries, saved workflow, marker mapping, floating AI bounds, fullscreen AI, keyboard access and overflow checks passed in 3 viewports.');await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
