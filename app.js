'use strict';
(function(){
  const year=document.getElementById('year');
  if(year)year.textContent=String(new Date().getFullYear());
  const menu=document.getElementById('menu-toggle');
  const nav=document.getElementById('mobile-nav');
  if(!menu||!nav)return;
  function setOpen(open){
    menu.setAttribute('aria-expanded',String(open));
    menu.setAttribute('aria-label',open?'Close menu':'Open menu');
    nav.hidden=!open;
  }
  menu.addEventListener('click',function(){setOpen(menu.getAttribute('aria-expanded')!=='true');});
  nav.querySelectorAll('a').forEach(function(a){a.addEventListener('click',function(){setOpen(false);});});
  document.addEventListener('keydown',function(e){if(e.key==='Escape')setOpen(false);});
  window.addEventListener('resize',function(){if(window.innerWidth>760)setOpen(false);});
})();