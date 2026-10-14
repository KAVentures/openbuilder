const canvas=document.querySelector('#game'),ctx=canvas.getContext('2d'),scoreLabel=document.querySelector('#score'),status=document.querySelector('#status');
const startButton=document.querySelector('#start');
let player=320,stars=[],score=0,lives=3,running=false,frame=0,last=0;
const keys=new Set();
function start(){player=320;stars=[];score=0;lives=3;frame=0;last=0;running=true;status.textContent='Lives: 3';scoreLabel.textContent='Score: 0';requestAnimationFrame(loop);}
function touch(e){const r=canvas.getBoundingClientRect();player=Math.min(610,Math.max(30,(e.clientX-r.left)*canvas.width/r.width));}
canvas.addEventListener('pointerdown',touch);canvas.addEventListener('pointermove',e=>{if(e.buttons)touch(e);});
document.addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight','a','d'].includes(e.key)){e.preventDefault();keys.add(e.key);}});
document.addEventListener('keyup',e=>keys.delete(e.key));
startButton.addEventListener('click',()=>{running=false;start();});
function star(x,y,r=9){ctx.fillStyle='#ffe783';ctx.beginPath();for(let i=0;i<10;i++){let a=i*Math.PI/5-Math.PI/2,rr=i%2?r*.44:r;let px=x+Math.cos(a)*rr,py=y+Math.sin(a)*rr;i?ctx.lineTo(px,py):ctx.moveTo(px,py);}ctx.closePath();ctx.fill();}
function render(){ctx.clearRect(0,0,640,420);ctx.fillStyle='#122446';ctx.fillRect(0,0,640,420);for(let i=0;i<40;i++){ctx.fillStyle='#284877';ctx.fillRect((i*149)%640,(i*79)%420,2,2);}ctx.fillStyle='#72f3e4';ctx.beginPath();ctx.roundRect(player-34,382,68,17,8);ctx.fill();for(const s of stars)star(s.x,s.y);}
function loop(time){
  if(!running)return;
  if(last===0)last=time;
  const delta=Math.min(40,time-last)/16.67;last=time;frame+=delta;
  if(keys.has('ArrowLeft')||keys.has('a'))player-=5*delta;
  if(keys.has('ArrowRight')||keys.has('d'))player+=5*delta;
  player=Math.max(34,Math.min(606,player));
  if(frame>35){stars.push({x:20+Math.random()*600,y:-10});frame=0;}
  for(const s of stars)s.y+=2.6*delta;
  for(const s of stars){if(s.y>372&&s.y<405&&Math.abs(s.x-player)<43){s.caught=true;score++;}else if(s.y>420&&!s.caught){s.caught=true;lives--;}}
  stars=stars.filter(s=>!s.caught);
  scoreLabel.textContent='Score: '+score;status.textContent='Lives: '+lives;
  render();
  if(lives<=0){running=false;status.textContent='Game over. Final score: '+score;return;}
  requestAnimationFrame(loop);
}
render();
