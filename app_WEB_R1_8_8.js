// R1.8.0: Check-in protagonista + privacidad estricta + combustible Pro + voz + QR + nombres legibles
const API_URL='https://hliqosobxhwdynhyubkc.supabase.co/functions/v1/super-handle';
const DIRECTORY_URL='https://mykndxvshtfydsetcync.supabase.co/functions/v1/bdempresaflota-api';
const WEB_VERSION='1.8.7';
const S={rut:'',key:'',company:null,connection:null,token:localStorage.getItem('efm_token')||'',user:null,vehicles:[],drivers:[],users:[],documents:[],roleProfiles:[],rows:{},notifications:[],notificationPending:[],notificationTimer:null,perfilOperativo:null,lastPrediction:null,lastCheckinSaved:null,history:[],companyConfig:null,talleres:[],checkinHistory:[],reportRows:[],orders:[],fuelNearby:[],fuelPosition:null,activeWorkshopGeo:null,actionButton:null,actionButtonAt:0,qrStream:null,qrScanTimer:null,voiceKind:null,voiceContext:null,voiceRecorder:null,voiceChunks:[],voiceBlob:null};

const PERMISSION_MODULES=[
 {id:'DASHBOARD',label:'Dashboard',actions:['LEER']},{id:'EMPRESA',label:'Empresa',actions:['LEER','EDITAR','LOGO']},{id:'PERFILES',label:'Perfiles',actions:['LEER','EDITAR']},
 {id:'VEHICULOS',label:'Vehículos',actions:['LEER','CREAR','EDITAR','ELIMINAR']},{id:'CONDUCTORES',label:'Conductores',actions:['LEER','CREAR','EDITAR','ELIMINAR']},
 {id:'ASIGNACIONES',label:'Asignaciones',actions:['LEER','CREAR','EDITAR','ELIMINAR','ACEPTAR']},{id:'DOCUMENTOS',label:'Documentos',actions:['LEER','CREAR','EDITAR','ELIMINAR']},
 {id:'CHECKIN',label:'Check-in técnico',actions:['LEER','CREAR','EDITAR','ELIMINAR','APROBAR_DIRECTO','GENERAR_QR']},{id:'FALLAS',label:'Fallas',actions:['LEER','REPORTAR','GESTIONAR','ELIMINAR']},
 {id:'MANTENCIONES',label:'Mantenciones',actions:['LEER','GESTIONAR','ELIMINAR']},{id:'TALLERES',label:'Talleres',actions:['LEER','CREAR','EDITAR','ELIMINAR']},{id:'HISTORIAL_MANTENCIONES',label:'Historial mantenciones',actions:['LEER']},
 {id:'COMBUSTIBLE',label:'Combustible',actions:['LEER','CREAR','GESTIONAR','ELIMINAR']},{id:'PREDICCIONES',label:'Análisis predictivo',actions:['LEER','USAR']},
 {id:'NOTIFICACIONES',label:'Notificaciones y alertas',actions:['LEER','MARCAR_LEIDA']},{id:'REPORTES',label:'Reportes',actions:['LEER','EXPORTAR']},{id:'USUARIOS',label:'Usuarios',actions:['LEER','CREAR','EDITAR','ELIMINAR','PERMISOS']}
];
const VIEW_PERMISSIONS={dashboard:'DASHBOARD',empresa:'EMPRESA',perfiles:'PERFILES',vehiculos:'VEHICULOS',conductores:'CONDUCTORES',asignaciones:'ASIGNACIONES',documentos:'DOCUMENTOS',checkin:'CHECKIN',checkinhistorial:'CHECKIN',checkinaprobaciones:'CHECKIN',fallas:'FALLAS',mantenciones:'MANTENCIONES',ordenes:'MANTENCIONES',talleres:'TALLERES',historial:'HISTORIAL_MANTENCIONES',predicciones:'PREDICCIONES',notificaciones:'NOTIFICACIONES',combustible:'COMBUSTIBLE',reportes:'REPORTES',usuarios:'USUARIOS'};
const FORM_MODULES={vehiculo:'VEHICULOS',conductor:'CONDUCTORES',checkin:'CHECKIN',falla:'FALLAS',mantencion:'MANTENCIONES',orden:'MANTENCIONES',taller:'TALLERES',combustible:'COMBUSTIBLE',asignacion:'ASIGNACIONES',taller:'TALLERES',usuario:'USUARIOS'};

const CHECKS=[
['NEUMATICOS','Neumáticos','CRITICA'],['LUCES','Luces','ALTA'],['FRENOS','Frenos','CRITICA'],
['PARABRISAS','Parabrisas','ALTA'],['CARROCERIA','Carrocería','MEDIA'],['ESPEJOS','Espejos','ALTA'],
['ACEITE','Nivel de aceite','ALTA'],['REFRIGERANTE','Refrigerante','ALTA'],['FRENOS_LIQ','Líquido de frenos','CRITICA'],
['DIRECCION','Dirección','CRITICA'],['SUSPENSION','Suspensión','ALTA'],['BATERIA','Batería','MEDIA'],
['TABLERO','Testigos tablero','ALTA'],['CINTURONES','Cinturones','CRITICA'],['EXTINTOR','Extintor','ALTA'],
['BOTIQUIN','Botiquín','MEDIA'],['DOCUMENTOS','Documentos','ALTA'],['BOCINA','Bocina','MEDIA']
];

function $(id){return document.getElementById(id)}
function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function normalizeRole(v){const r=String(v||'').toUpperCase().trim().replace(/_/g,'-').replace(/\s+/g,'-');if(['ADMIN','ADMINISTRADOR','ROL-ADMINISTRADOR','ROL-SYSADMIN'].includes(r))return 'ROL-ADMIN';if(['GERENCIA','GERENTE','ROL-GERENTE'].includes(r))return 'ROL-GERENCIA';if(['OPERADOR','ROL-OPERADOR'].includes(r))return 'ROL-OPERADOR';if(['SUPERVISOR','JEFE','ROL-JEFE'].includes(r))return 'ROL-SUPERVISOR';if(['CONDUCTOR','CHOFER','ROL-CHOFER'].includes(r))return 'ROL-CONDUCTOR';return r}
function roleId(){return normalizeRole(S.user?.rolId||S.user?.ROL_ID)}
function roleLabel(v){const r=normalizeRole(v);return({'ROL-ADMIN':'Administrador','ROL-GERENCIA':'Gerencia','ROL-OPERADOR':'Operador','ROL-SUPERVISOR':'Supervisor','ROL-CONDUCTOR':'Conductor','ROL-SUPERVISOR-GEO':'Supervisor geográfico'})[r]||String(v||'Sin perfil').replace('ROL-','')}
function personalPermissions(user=S.user){let p=user?.permisosPersonalizados??user?.permisos_personalizados??{};if(typeof p==='string'){try{p=JSON.parse(p)}catch{p={}}}return p&&typeof p==='object'?p:{}}
function canonicalPermission(module,action){let a=String(action||'LEER').toUpperCase(),m=String(module||'').toUpperCase();if(a==='VER')a='LEER';if(m==='CHECKIN'&&a==='APROBAR')a='APROBAR_DIRECTO';if(m==='PREDICCIONES'&&a==='GENERAR')a='USAR';if(m==='FALLAS'&&a==='CREAR')a='REPORTAR';if(m==='FALLAS'&&a==='EDITAR')a='GESTIONAR';if(m==='MANTENCIONES'&&['CREAR','EDITAR'].includes(a))a='GESTIONAR';if(m==='COMBUSTIBLE'&&a==='EDITAR')a='GESTIONAR';return{module:m,action:a}}
function permissionAllowed(module,action='LEER',user=S.user){const c=canonicalPermission(module,action);module=c.module;action=c.action;const rr=normalizeRole(user?.rolId||user?.rol_id);if(module==='CHECKIN'&&action==='APROBAR_DIRECTO'&&!['ROL-ADMIN','ROL-GERENCIA'].includes(rr))return false;if(rr==='ROL-ADMIN')return true;if(String(user?.modoPermisos||user?.modo_permisos||'ROL').toUpperCase()==='PERSONALIZADO')return personalPermissions(user)?.[module]?.[action]===true;const configured=user?.permisosRol?.[module]?.[action];if(typeof configured==='boolean')return configured;const defaults={
 'ROL-GERENCIA':'*','ROL-OPERADOR':{DASHBOARD:['LEER'],PERFILES:['LEER','EDITAR'],VEHICULOS:['LEER'],CONDUCTORES:['LEER'],ASIGNACIONES:['LEER','CREAR','EDITAR','ACEPTAR'],DOCUMENTOS:['LEER','CREAR','EDITAR'],CHECKIN:['LEER','CREAR','EDITAR','GENERAR_QR'],FALLAS:['LEER','REPORTAR','GESTIONAR'],MANTENCIONES:['LEER','GESTIONAR'],HISTORIAL_MANTENCIONES:['LEER'],COMBUSTIBLE:['LEER','CREAR','GESTIONAR'],PREDICCIONES:['LEER','USAR'],NOTIFICACIONES:['LEER','MARCAR_LEIDA']},
 'ROL-SUPERVISOR':{DASHBOARD:['LEER'],PERFILES:['LEER','EDITAR'],VEHICULOS:['LEER'],CONDUCTORES:['LEER'],ASIGNACIONES:['LEER','CREAR','EDITAR','ACEPTAR'],DOCUMENTOS:['LEER','CREAR','EDITAR'],CHECKIN:['LEER','CREAR','EDITAR','GENERAR_QR'],FALLAS:['LEER','REPORTAR','GESTIONAR'],MANTENCIONES:['LEER','GESTIONAR'],HISTORIAL_MANTENCIONES:['LEER'],COMBUSTIBLE:['LEER','CREAR','GESTIONAR'],PREDICCIONES:['LEER','USAR'],NOTIFICACIONES:['LEER','MARCAR_LEIDA']},
 'ROL-SUPERVISOR-GEO':{DASHBOARD:['LEER'],PERFILES:['LEER','EDITAR'],VEHICULOS:['LEER'],CONDUCTORES:['LEER'],ASIGNACIONES:['LEER','ACEPTAR'],DOCUMENTOS:['LEER'],CHECKIN:['LEER','CREAR'],FALLAS:['LEER','REPORTAR','GESTIONAR'],MANTENCIONES:['LEER'],HISTORIAL_MANTENCIONES:['LEER'],PREDICCIONES:['LEER','USAR'],NOTIFICACIONES:['LEER','MARCAR_LEIDA']},
 'ROL-CONDUCTOR':{DASHBOARD:['LEER'],PERFILES:['LEER','EDITAR'],VEHICULOS:['LEER'],ASIGNACIONES:['LEER','ACEPTAR'],DOCUMENTOS:['LEER'],CHECKIN:['LEER','CREAR'],FALLAS:['LEER','REPORTAR'],MANTENCIONES:['LEER'],HISTORIAL_MANTENCIONES:['LEER'],COMBUSTIBLE:['LEER','CREAR'],NOTIFICACIONES:['LEER','MARCAR_LEIDA']}};const d=defaults[normalizeRole(user?.rolId||user?.rol_id)];return d==='*'?true:Boolean(d?.[module]?.includes(action))}
function canManage(module,action='EDITAR'){return module?permissionAllowed(module,action):['ROL-ADMIN','ROL-GERENCIA'].includes(roleId())}
function isAdmin(){return roleId()==='ROL-ADMIN'}
function isManagement(){return ['ROL-ADMIN','ROL-GERENCIA'].includes(roleId())}
function adminActions(formKey,id,{approve=false}={}){
 const module=FORM_MODULES[formKey];
 if(!permissionAllowed(module,'EDITAR')&&!permissionAllowed(module,'ELIMINAR'))return '';
 return `<div class="card-actions">
   ${permissionAllowed(module,'EDITAR')?`<button class="mini edit" data-edit-form="${esc(formKey)}" data-id="${esc(id)}">✎ Editar</button>`:''}
   ${approve&&permissionAllowed('CHECKIN','APROBAR')?`<button class="mini approve" data-approve-checkin="${esc(id)}">✓ Aprobar directo</button>`:''}
   ${permissionAllowed(module,'ELIMINAR')?`<button class="mini danger" data-delete-form="${esc(formKey)}" data-id="${esc(id)}">Eliminar</button>`:''}
 </div>`;
}

const buttonFeedbackTimers=new WeakMap();
function actionButtonFresh(){return S.actionButton&&document.contains(S.actionButton)&&(Date.now()-Number(S.actionButtonAt||0)<5000)?S.actionButton:null}
function clearButtonFeedbackTimer(btn){const t=buttonFeedbackTimers.get(btn);if(t)clearTimeout(t);buttonFeedbackTimers.delete(btn)}
function setButtonFeedback(btn,state){
 if(!btn)return;btn.classList.add('ux-feedback-button');clearButtonFeedbackTimer(btn);
 btn.classList.remove('is-loading','is-success','is-error');
 if(state==='loading'){
   if(btn.dataset.uxWasDisabled===undefined)btn.dataset.uxWasDisabled=btn.disabled?'1':'0';
   btn.classList.add('is-loading');btn.setAttribute('aria-busy','true');btn.disabled=true;return;
 }
 btn.removeAttribute('aria-busy');if(btn.dataset.uxWasDisabled==='0')btn.disabled=false;
 if(state==='success'||state==='error'){
   btn.classList.add(state==='success'?'is-success':'is-error');
   const timer=setTimeout(()=>{btn.classList.remove('is-success','is-error');delete btn.dataset.uxWasDisabled;buttonFeedbackTimers.delete(btn)},1300);buttonFeedbackTimers.set(btn,timer);
 }else delete btn.dataset.uxWasDisabled;
}
function toast(msg,error=false){
 const n=document.createElement('div');n.className='toast '+(error?'error':'success');
 const icon=document.createElement('span');icon.className='toast-status-icon';icon.textContent=error?'✕':'✓';
 const textNode=document.createElement('span');textNode.className='toast-message';textNode.textContent=String(msg||'');
 n.append(icon,textNode);$('toast').append(n);const btn=actionButtonFresh();if(btn)setButtonFeedback(btn,error?'error':'success');setTimeout(()=>n.remove(),4200)
}
function friendlyError(message){const raw=String(message||'ERROR');return({CHECKIN_YA_GUARDADO_USA_NUEVA_INSPECCION:'Este Check-in ya fue guardado. Usa “Nueva inspección” para iniciar otro.',KILOMETRAJE_REQUERIDO:'Ingresa el kilometraje actual del vehículo.',VEHICULO_REQUERIDO:'Selecciona una tarjeta de vehículo.',SOLO_CONDUCTOR_O_SUPERVISOR_GEO_PUEDE_ASOCIARSE:'Solo una cuenta Conductor o Supervisor geográfico puede asociarse a un conductor.',CONDUCTOR_ASOCIADO_NO_ENCONTRADO:'El conductor seleccionado ya no está disponible.',PERMISO_DENEGADO:'La cuenta no tiene permiso para esta acción. Si eres Administrador, despliega la API incluida en este paquete.'})[raw]||raw}
function loading(btn,on){
 if(!btn)return;
 if(on){btn.dataset.busy='1';setButtonFeedback(btn,'loading')}
 else{btn.dataset.busy='0';if(!btn.classList.contains('is-success')&&!btn.classList.contains('is-error'))setButtonFeedback(btn,'idle')}
}

async function api(action,data={},auth=true){
 const h={'Content-Type':'application/json'};if(auth&&S.token)h.Authorization='Bearer '+S.token;
 const actionBtn=actionButtonFresh();if(actionBtn)setButtonFeedback(actionBtn,'loading');
 try{
   const r=await fetch(API_URL,{method:'POST',headers:h,body:JSON.stringify({accion:action,...data})});
   let j={};try{j=await r.json()}catch{}
   if(!r.ok||j.ok===false){const e=new Error(j.error||'ERROR_API');e.status=r.status;e.data=j;throw e}
   if(actionBtn)setButtonFeedback(actionBtn,'success');return j;
 }catch(e){if(actionBtn)setButtonFeedback(actionBtn,'error');if(e instanceof TypeError||/Failed to fetch|NetworkError|Load failed/i.test(String(e?.message||'')))e.isNetworkError=true;throw e}
}

function saveConnection(company,needsSetup=false){
 const conn={id:company?.id||'',rut:company?.rut||'',nombre:company?.nombre||'',estado:company?.estado||'ACTIVA',needsSetup:Boolean(needsSetup),savedAt:new Date().toISOString()};
 if(!conn.id||!conn.rut)return;
 localStorage.setItem('efm_company_connection',JSON.stringify(conn));
 localStorage.setItem('efm_rut',conn.rut);
 S.connection=conn;S.company={id:conn.id,rut:conn.rut,nombre:conn.nombre,estado:conn.estado};S.rut=conn.rut;
}
function loadConnection(){
 try{
   const raw=localStorage.getItem('efm_company_connection');if(!raw)return false;
   const conn=JSON.parse(raw);if(!conn?.id||!conn?.rut)return false;
   S.connection=conn;S.company={id:conn.id,rut:conn.rut,nombre:conn.nombre,estado:conn.estado||'ACTIVA'};S.rut=conn.rut;return true;
 }catch{return false}
}
function updateConnectionSetup(needsSetup){
 if(!S.connection)return;S.connection.needsSetup=Boolean(needsSetup);localStorage.setItem('efm_company_connection',JSON.stringify(S.connection));
}
function showSavedLogin(){
 if(!S.company)return accessStep('stepCompany');
 $('loginCompany').textContent=`${S.company.nombre} · ${S.company.rut}`;accessStep('stepLogin');
}
function clearConnection(showMessage=true){
 S.token='';S.user=null;S.company=null;S.connection=null;S.rut='';S.key='';
 localStorage.removeItem('efm_token');localStorage.removeItem('efm_company_connection');localStorage.removeItem('efm_rut');
 $('rut').value='';$('installKey').value='';$('keyWrap').classList.add('hidden');accessStep('stepCompany');
 if(showMessage)toast('Conexión de empresa eliminada. Debes validar nuevamente el RUT.');
}

function accessStep(which){
 ['stepCompany','stepSetup','stepLogin'].forEach(x=>$(x).classList.add('hidden'));
 $(which).classList.remove('hidden');
}
async function resolveCompany(){
 const b=$('btnResolve');loading(b,true);
 const status=$('companyResult');if(status){status.classList.remove('hidden');status.textContent='Consultando empresa…';}
 try{
   S.rut=$('rut').value.trim(); S.key=$('installKey').value.trim();
   const j=await api('resolverEmpresa',{rut:S.rut,claveInstalacion:S.key},false);
   S.company=j.empresa;saveConnection(j.empresa,j.needsSetup);
   $('companyResult').classList.remove('hidden');
   $('companyResult').textContent=`${j.empresa.nombre} · ${j.empresa.rut}`;
   if(j.needsSetup) accessStep('stepSetup'); else {
     $('loginCompany').textContent=`${j.empresa.nombre} · ${j.empresa.rut}`;
     accessStep('stepLogin');
   }
 }catch(e){
   if(e.message==='CLAVE_INSTALACION_REQUERIDA'){
     $('keyWrap').classList.remove('hidden');toast('El Directorio requiere la clave de instalación.',true);$('installKey').focus();
   }else toast('No fue posible validar empresa: '+e.message,true);
 }finally{loading(b,false)}
}
async function setup(){
 const b=$('btnSetup');loading(b,true);
 try{
  await api('crearPrimerUsuario',{empresaId:S.company?.id,nombre:$('setupName').value,correo:$('setupEmail').value,contrasena:$('setupPassword').value},false);
  updateConnectionSetup(false);$('loginCompany').textContent=`${S.company.nombre} · ${S.company.rut}`;
  $('loginEmail').value=$('setupEmail').value;accessStep('stepLogin');toast('Administrador creado. Ya puedes ingresar.');
 }catch(e){toast('No fue posible crear administrador: '+e.message,true)}finally{loading(b,false)}
}
async function login(){
 const b=$('btnLogin');loading(b,true);
 try{
   const j=await api('login',{empresaId:S.company?.id,rut:S.company?.rut,correo:$('loginEmail').value,contrasena:$('loginPassword').value},false);
   S.token=j.token;S.user=j.user;S.company=j.empresa;saveConnection(j.empresa,false);localStorage.setItem('efm_token',S.token);
   enterApp();
 }catch(e){toast('Ingreso rechazado: '+e.message,true)}finally{loading(b,false)}
}
async function restore(){
 if(!S.token){if(S.connection?.needsSetup)accessStep('stepSetup');else if(S.company)showSavedLogin();else accessStep('stepCompany');return;}
 try{const j=await api('me',{},true);S.user=j.user;S.rut=j.empresa.rut;S.company=j.empresa;saveConnection(j.empresa,false);enterApp()}catch{logout(false)}
}
function logout(show=true){S.token='';S.user=null;localStorage.removeItem('efm_token');if(S.notificationTimer){clearInterval(S.notificationTimer);S.notificationTimer=null}$('notificationCenter')?.classList.add('hidden');$('appView').classList.add('hidden');$('accessView').classList.remove('hidden');$('nexoDock')?.classList.add('hidden');$('nexoFab')?.classList.add('hidden');$('nexoPanel')?.classList.add('hidden');$('nexoVisibilityToggle')?.classList.add('hidden');if(S.company)showSavedLogin();else accessStep('stepCompany');if(show)toast('Sesión cerrada')}
const SIDEBAR_BREAKPOINT=760;
function sidebarIsMobile(){return window.innerWidth<=SIDEBAR_BREAKPOINT}
function syncSidebarA11y(){
 const app=$('appView'),toggle=$('sidebarToggle');if(!app||!toggle)return;
 const open=sidebarIsMobile()?app.classList.contains('sidebar-open'):!app.classList.contains('sidebar-collapsed');
 toggle.setAttribute('aria-expanded',String(open));toggle.setAttribute('aria-label',open?'Cerrar menú principal':'Abrir menú principal');
}
function restoreSidebarState(){
 const app=$('appView');if(!app)return;
 if(sidebarIsMobile()){app.classList.remove('sidebar-collapsed','sidebar-open');}
 else{app.classList.remove('sidebar-open');app.classList.toggle('sidebar-collapsed',localStorage.getItem('efm_web_sidebar_collapsed')==='1');}
 syncSidebarA11y();
}
function toggleSidebar(){
 const app=$('appView');if(!app)return;
 if(sidebarIsMobile())app.classList.toggle('sidebar-open');
 else{app.classList.toggle('sidebar-collapsed');localStorage.setItem('efm_web_sidebar_collapsed',app.classList.contains('sidebar-collapsed')?'1':'0');}
 syncSidebarA11y();
}
function closeSidebar(){
 const app=$('appView');if(!app)return;
 if(sidebarIsMobile())app.classList.remove('sidebar-open');else{app.classList.add('sidebar-collapsed');localStorage.setItem('efm_web_sidebar_collapsed','1');}
 syncSidebarA11y();
}
function closeSidebarAfterNavigation(){if(sidebarIsMobile()){$('appView')?.classList.remove('sidebar-open');syncSidebarA11y();}}
function prepareOverlayOpen(){
 closeSidebarAfterNavigation();
 $('notificationCenter')?.classList.add('hidden');
 $('profileMenu')?.classList.add('hidden');
 $('nexoPanel')?.classList.add('hidden');
}
function openOverlay(id){prepareOverlayOpen();$(id)?.classList.remove('hidden')}
function firstAllowedView(){return Object.keys(VIEW_PERMISSIONS).find(v=>v!=='usuarios'&&permissionAllowed(VIEW_PERMISSIONS[v],'VER'))||'sin-acceso'}
function applyPermissionsUi(){
 document.querySelectorAll('#nav [data-view]').forEach(b=>{const v=b.dataset.view,module=VIEW_PERMISSIONS[v];const managementOnly=['usuarios','checkinaprobaciones'].includes(v);b.classList.toggle('hidden',managementOnly?!isManagement():!permissionAllowed(module,'VER'))});
 document.querySelectorAll('[data-open-form]').forEach(b=>{const m=FORM_MODULES[b.dataset.openForm];b.classList.toggle('hidden',!permissionAllowed(m,'CREAR'))});
 $('btnNewDocument')?.classList.toggle('hidden',!permissionAllowed('DOCUMENTOS','CREAR'));
 $('btnNewAssignment')?.classList.toggle('hidden',!permissionAllowed('ASIGNACIONES','CREAR'));
 $('btnGenerateCheckinQr')?.classList.toggle('hidden',!permissionAllowed('CHECKIN','GENERAR_QR'));
 $('btnMarkAllConforme')?.classList.toggle('hidden',!permissionAllowed('CHECKIN','CREAR'));
 $('btnSaveCheckin')?.classList.toggle('hidden',!permissionAllowed('CHECKIN','CREAR'));
 syncNexoVisibility();
 updateCheckinActionHub();
}
function enterApp(){
 $('accessView').classList.add('hidden');$('appView').classList.remove('hidden');
 $('sideUser').innerHTML=`<strong>${esc(S.user?.nombre||'')}</strong><br>${esc(roleLabel(S.user?.rolId))}`;
 applyPermissionsUi();
 restoreSidebarState();
 loadProfile();loadCompanyModule(false);loadNotifications(false);if(S.notificationTimer)clearInterval(S.notificationTimer);S.notificationTimer=setInterval(()=>{if(document.visibilityState==='visible')loadNotifications(false)},10000);
 showView(permissionAllowed('DASHBOARD','VER')?'dashboard':firstAllowedView());
}
function showView(v){
 const module=VIEW_PERMISSIONS[v];
 if((['usuarios','checkinaprobaciones'].includes(v)&&!isManagement())||(module&&!permissionAllowed(module,'VER'))){toast('Tu perfil no tiene permiso para abrir este módulo',true);v=firstAllowedView()}
 document.querySelectorAll('.view').forEach(x=>x.classList.remove('active'));
 document.querySelectorAll('#nav button').forEach(x=>x.classList.toggle('active',x.dataset.view===v));
 $('view-'+v)?.classList.add('active');
 const titles={dashboard:'Dashboard',empresa:'Empresa',perfiles:'Perfiles',vehiculos:'Vehículos',conductores:'Conductores',asignaciones:'Asignaciones',documentos:'Documentos',checkin:'Check-in técnico',checkinhistorial:'Historial de Check-in',checkinaprobaciones:'Aprobar Check-in',fallas:'Fallas',mantenciones:'Mantenciones',ordenes:'Órdenes de servicio',talleres:'Talleres',historial:'Historial de mantenciones',predicciones:'Análisis predictivo',notificaciones:'Notificaciones y alertas',combustible:'Combustible',reportes:'Reportes PDF / XLSX',usuarios:'Usuarios y permisos','sin-acceso':'Sin módulos habilitados'};
 $('pageTitle').textContent=titles[v]||v;
 // R1.8.6: encabezado limpio. Se conserva título del módulo y badge de versión;
 // NO se muestra enunciado descriptivo entre ambos.
 if($('pageSubtitle')) $('pageSubtitle').textContent='';
 closeSidebarAfterNavigation();
 refresh(v);
}
async function refresh(v){
 try{
   if(v==='dashboard')return loadDashboard();
   if(v==='empresa')return loadCompanyModule();
   if(v==='perfiles')return loadProfileView();
   if(v==='vehiculos')return loadVehicles();
   if(v==='conductores')return loadDrivers();
   if(v==='asignaciones')return loadAssignments();
   if(v==='documentos')return loadDocuments();
   if(v==='checkin')return loadCheckin();
   if(v==='checkinhistorial')return loadCheckinHistory();
   if(v==='checkinaprobaciones')return loadCheckinApprovals();
   if(v==='fallas')return loadCards('FALLAS','fallasRows',fallCard);
   if(v==='mantenciones')return loadMaintenance();
   if(v==='ordenes')return loadServiceOrders();
   if(v==='talleres')return loadWorkshops();
   if(v==='historial')return loadMaintenanceHistory();
   if(v==='predicciones')return loadPredictions();
   if(v==='notificaciones')return loadNotifications(true);
   if(v==='combustible')return loadFuelModule();
   if(v==='reportes')return loadReports();
   if(v==='usuarios')return loadUsers();
 }catch(e){if(e.status===401){logout(false);toast('Sesión expirada',true)}else toast('Error: '+e.message,true)}
}
function ringKpi(label,value,progress=0,tone='blue',detail=''){
 const p=Math.max(0,Math.min(100,Number(progress)||0));
 return `<article class="ring-kpi ${esc(tone)}"><div class="ring-gauge" style="--progress:${p}"><div><strong>${esc(value)}</strong></div></div><h4>${esc(label)}</h4>${detail?`<p>${esc(detail)}</p>`:''}</article>`;
}
async function loadDashboard(){
 const j=await api('dashboard');const r=j.resumen||{};
 const ks=[['Vehículos',r.vehiculos||0],['Check-in hoy',r.checkins_hoy||0],['Fallas abiertas',r.fallas_abiertas||0],['Fallas críticas',r.fallas_criticas||0],['Mantenciones',r.mantenciones_pendientes||0],['Costo mes','$ '+Number(r.costo_mes||0).toLocaleString('es-CL')]];
 $('kpis').innerHTML=ks.map(([a,b])=>`<div class="kpi"><small>${esc(a)}</small><strong>${esc(b)}</strong></div>`).join('');
 const rows=j.saludVehiculos||[];
 const avgHealth=rows.length?Math.round(rows.reduce((a,x)=>a+Number(x.salud_porcentaje||0),0)/rows.length):0;
 const avgRisk=rows.length?Math.round(rows.reduce((a,x)=>a+Number(x.riesgo_porcentaje||0),0)/rows.length):0;
 const fleet=Math.max(1,Number(r.vehiculos||rows.length||1));
 $('fleetRings').innerHTML=ringKpi('Salud de flota',`${avgHealth}%`,avgHealth,avgHealth<50?'red':avgHealth<75?'amber':'green','Promedio de unidades')+ringKpi('Riesgo operacional',`${avgRisk}%`,avgRisk,avgRisk>=60?'red':avgRisk>=30?'amber':'blue','Exposición estimada')+ringKpi('Mantención pendiente',String(r.mantenciones_pendientes||0),Math.min(100,Number(r.mantenciones_pendientes||0)/fleet*100),Number(r.mantenciones_pendientes||0)?'amber':'green','Ligada a vehículos');
 $('healthRows').innerHTML=rows.length?rows.map(x=>`<div class="table-row"><strong>${esc(x.patente||x.vehiculo_patente||'Vehículo asociado')}</strong><span>${esc(x.marca||'')} ${esc(x.modelo||'')}</span><span>Salud ${Number(x.salud_porcentaje||0).toFixed(0)}%</span><div class="health-bar"><span style="width:${Math.max(0,Math.min(100,Number(x.salud_porcentaje||0)))}%"></span></div><span>Riesgo ${Number(x.riesgo_porcentaje||0).toFixed(0)}%</span></div>`).join(''):'<p class="muted">Aún no hay indicadores de salud calculados.</p>';
}

async function loadProfileView(){
 await loadProfile();const p=S.perfilOperativo||{},u=S.user||{},c=p.conductor||{},v=p.vehiculo||{};
 $('profileOverview').innerHTML=`<article class="profile-main-card"><div class="profile-big-avatar">${u.fotoUrl?`<img src="${esc(u.fotoUrl)}" alt="Foto">`:esc(initials(u.nombre))}</div><div><span class="profile-label">PERFIL DE ACCESO</span><h3>${esc(u.nombre||'Usuario')}</h3><p>${esc(u.correo||'')} · ${esc(u.telefono||'Sin teléfono')}</p><div class="profile-pills"><span>${esc(roleLabel(u.rolId))}</span><span>${esc(u.modoPermisos||'ROL')}</span></div></div></article>`;
 $('profileOperational').innerHTML=`<article class="life-summary-card"><span class="life-icon">👤</span><small>CONDUCTOR ASOCIADO</small><h3>${esc(c.nombre||'Sin asociación')}</h3><p>${c.id?`${esc(c.rut||'Sin RUT')} · Licencia ${esc(c.licencia_clase||'—')}`:'Un administrador puede asociar esta cuenta desde Conductores.'}</p>${c.id?`<button class="mini detail" data-life-driver="${esc(c.id)}">Abrir hoja de vida</button>`:''}</article><article class="life-summary-card"><span class="life-icon">🚙</span><small>VEHÍCULO VIGENTE</small><h3>${esc(v.patente||'Sin vehículo')}</h3><p>${v.id?`${esc(v.marca||'')} ${esc(v.modelo||'')} · ${Number(v.kilometraje||0).toLocaleString('es-CL')} km`:'No existe una asignación vigente asociada.'}</p>${v.id?`<button class="mini detail" data-life-vehicle="${esc(v.id)}">Abrir hoja de vida</button>`:''}</article>`;
 try{
  const profiles=await api('PERFILES_ACCESO',{},true);S.roleProfiles=profiles.rows||[];renderRoleProfiles();
 }catch(e){$('roleProfileCards').innerHTML=`<div class="notification-empty">No fue posible cargar los perfiles: ${esc(e.message)}</div>`}
}

function renderRoleProfiles(){
 const q=String($('profileSearch')?.value||'').trim().toLowerCase(),filter=normalizeRole($('profileRoleFilter')?.value||'');
 let visible=isManagement()?S.roleProfiles:S.roleProfiles.filter(x=>normalizeRole(x.id)===roleId());
 if(filter)visible=visible.filter(x=>normalizeRole(x.id)===filter);
 if(q)visible=visible.filter(x=>`${x.nombre||''} ${x.descripcion||''} ${x.id||''}`.toLowerCase().includes(q));
 $('roleProfileCards').innerHTML=visible.length?visible.map(x=>{const modules=Object.values(x.permisos||{}),enabled=modules.reduce((n,a)=>n+Object.values(a||{}).filter(Boolean).length,0),total=modules.reduce((n,a)=>n+Object.keys(a||{}).length,0);return `<article class="role-profile-card ${x.irreductible?'admin-profile':''}"><div class="role-profile-head"><span>${esc(initials(x.nombre))}</span><div><small>PERFIL</small><h4>${esc(x.nombre)}</h4><code>${esc(x.id)}</code></div></div><p>${esc(x.descripcion||'Perfil de acceso')}</p><div class="role-profile-meter"><span style="width:${total?Math.round(enabled/total*100):0}%"></span></div><div class="role-profile-foot"><small>${enabled} de ${total} acciones habilitadas</small>${isManagement()?`<button class="mini permissions" data-role-permissions="${esc(x.id)}">${x.irreductible?'Ver matriz':'Configurar matriz'}</button>`:''}</div></article>`}).join(''):'<div class="notification-empty">No hay perfiles para este filtro.</div>';
}

// ====================== R1.8.6 · FILTROS AVANZADOS + TÍTULOS LIMPIOS ======================
const ADV_FILTERS={
 vehiculos:{state:['estado'],category:['categoria','tipo','combustible'],criticality:['criticidad','nivel_riesgo','riesgo'],date:['actualizado_en','creado_en']},
 conductores:{state:['estado'],category:['categoria','licencia_clase'],criticality:['criticidad','nivel_riesgo'],date:['actualizado_en','creado_en','licencia_vencimiento']},
 asignaciones:{state:['estado'],category:['categoria','tipo'],criticality:['criticidad','prioridad'],date:['fecha_asignacion','creado_en','actualizado_en']},
 documentos:{state:r=>docComputedState(r),category:['tipo_documento'],criticality:['criticidad','prioridad'],date:['fecha_vencimiento','fecha_emision','creado_en']},
 checkinhistorial:{state:['estado'],category:['resultado_tecnico','tipo','origen'],criticality:['criticidad','severidad'],date:['fecha_inicio','fecha_fin','creado_en']},
 checkinaprobaciones:{state:['estado'],category:['resultado_tecnico','tipo','origen'],criticality:['criticidad','severidad'],date:['fecha_inicio','fecha_fin','creado_en']},
 fallas:{state:['estado'],category:['categoria','origen','tipo'],criticality:['criticidad','severidad'],date:['fecha_detectada','creado_en','actualizado_en']},
 mantenciones:{state:['estado'],category:['tipo','categoria'],criticality:['prioridad','criticidad'],date:['fecha_programada','fecha_inicio','fecha_termino','creado_en']},
 ordenes:{state:['estado'],category:['tipo','categoria'],criticality:['prioridad','criticidad'],date:['fecha_programada','fecha_apertura','creado_en']},
 talleres:{state:['estado'],category:['especialidad','categoria'],criticality:['criticidad','prioridad'],date:['actualizado_en','creado_en']},
 historial:{state:['estado'],category:['tipo','categoria'],criticality:['prioridad','criticidad'],date:['fecha_termino','fecha_inicio','fecha_programada','actualizado_en']},
 predicciones:{state:['estado'],category:['tipo_prediccion','categoria'],criticality:['nivel_riesgo','criticidad'],date:['fecha_prediccion','creado_en','actualizado_en']},
 notificaciones:{state:r=>String(r.estado_respuesta||((String(r.leida||'NO').toUpperCase()==='SI')?'LEIDA':'PENDIENTE')),category:['categoria','entidad_tipo'],criticality:['prioridad','criticidad'],date:['fecha_hora','creado_en']},
 combustible:{state:['estado'],category:['tipo_combustible','combustible','categoria'],criticality:r=>String(r.consumo_anomalo||'').toUpperCase()==='SI'?'ANOMALIA':'NORMAL',date:['fecha_hora','fecha_carga','creado_en']},
 usuarios:{state:['estado'],category:['rol_id'],criticality:['criticidad'],date:['ultimo_acceso','creado_en','actualizado_en']},
 reportes:{state:['estado'],category:['categoria','tipo','tipo_documento','resultado_tecnico'],criticality:['criticidad','severidad','prioridad','nivel_riesgo'],date:['fecha_hora','fecha_inicio','fecha_programada','fecha_detectada','creado_en','actualizado_en']}
};
function advSpecValue(row,spec){
 if(typeof spec==='function')return spec(row);
 for(const k of(spec||[])){const v=row?.[k];if(v!==undefined&&v!==null&&String(v).trim()!=='')return String(v).trim()}
 return'';
}
function advDateValue(row,spec){
 const raw=advSpecValue(row,spec);if(!raw)return null;const d=new Date(/^\d{4}-\d{2}-\d{2}$/.test(raw)?raw+'T12:00:00':raw);return Number.isNaN(d.getTime())?null:d;
}
function advText(row){
 const primitive=Object.values(row||{}).filter(v=>['string','number','boolean'].includes(typeof v)).join(' ');
 const related=[vehicleName(row?.vehiculo_id),driverName(row?.conductor_id),workshopName(row?.taller_id)].join(' ');
 return `${primitive} ${related}`.toLowerCase();
}
function advBar(module){return document.querySelector(`.advanced-filter-bar[data-filter-module="${module}"]`)}
function advControl(module,selector){return advBar(module)?.querySelector(selector)||null}
function advancedFilteredRows(module,rows){
 const cfg=ADV_FILTERS[module]||{},bar=advBar(module);if(!bar)return rows||[];
 const q=String(bar.querySelector('[data-filter-search]')?.value||'').trim().toLowerCase();
 const state=String(bar.querySelector('[data-filter-state]')?.value||'').toUpperCase();
 const category=String(bar.querySelector('[data-filter-category]')?.value||'').toUpperCase();
 const criticality=String(bar.querySelector('[data-filter-criticality]')?.value||'').toUpperCase();
 const from=bar.querySelector('[data-filter-from]')?.value||'',to=bar.querySelector('[data-filter-to]')?.value||'';
 const fromDate=from?new Date(from+'T00:00:00'):null,toDate=to?new Date(to+'T23:59:59.999'):null;
 const vehicle=bar.querySelector('[data-filter-extra="vehicle"]')?.value||'';
 const entity=String(bar.querySelector('[data-filter-extra="entity"]')?.value||'').toUpperCase();
 return (rows||[]).filter(row=>{
   if(q&&!advText(row).includes(q))return false;
   if(state&&String(advSpecValue(row,cfg.state)).toUpperCase()!==state)return false;
   if(category&&String(advSpecValue(row,cfg.category)).toUpperCase()!==category)return false;
   if(criticality&&String(advSpecValue(row,cfg.criticality)).toUpperCase()!==criticality)return false;
   if(vehicle&&String(row?.vehiculo_id||'')!==String(vehicle))return false;
   if(entity&&String(row?.tipo_entidad||'').toUpperCase()!==entity)return false;
   if(fromDate||toDate){const d=advDateValue(row,cfg.date);if(!d)return false;if(fromDate&&d<fromDate)return false;if(toDate&&d>toDate)return false}
   return true;
 });
}
function advOptionLabel(module,kind,value){
 if(module==='usuarios'&&kind==='category')return roleLabel(value);
 return String(value||'').replaceAll('_',' ');
}
function populateAdvancedFilter(module,rows){
 const cfg=ADV_FILTERS[module]||{},bar=advBar(module);if(!bar)return;
 for(const [kind,attr,spec,allLabel] of [['state','[data-filter-state]',cfg.state,'Todos'],['category','[data-filter-category]',cfg.category,'Todas'],['criticality','[data-filter-criticality]',cfg.criticality,'Todas']]){
   const sel=bar.querySelector(attr);if(!sel)continue;const keep=sel.value;
   const vals=[...new Set((rows||[]).map(r=>advSpecValue(r,spec)).filter(v=>String(v).trim()!==''))].sort((a,b)=>String(a).localeCompare(String(b),'es'));
   sel.innerHTML=`<option value="">${allLabel}</option>`+vals.map(v=>`<option value="${esc(v)}">${esc(advOptionLabel(module,kind,v))}</option>`).join('');
   if(vals.some(v=>String(v)===String(keep)))sel.value=keep;
   sel.disabled=vals.length===0;
 }
}
function clearAdvancedFilter(module){
 const bar=advBar(module);if(!bar)return;bar.querySelectorAll('input').forEach(i=>i.value='');bar.querySelectorAll('select').forEach(s=>s.value='');renderAdvancedModule(module);
}
function renderAdvancedModule(module){
 const map={vehiculos:renderVehicles,conductores:renderDrivers,asignaciones:renderAssignments,documentos:renderDocuments,checkinhistorial:renderCheckinHistory,checkinaprobaciones:renderCheckinApprovals,fallas:renderFailures,mantenciones:renderMaintenance,ordenes:renderServiceOrders,talleres:renderWorkshops,historial:renderMaintenanceHistory,predicciones:renderPredictions,notificaciones:renderNotificationPage,combustible:renderFuelModule,usuarios:renderUsers,reportes:renderReport};
 const fn=map[module];if(typeof fn==='function')fn();
}
function wireAdvancedFilters(){
 document.querySelectorAll('.advanced-filter-bar[data-filter-module]').forEach(bar=>{
   const module=bar.dataset.filterModule;
   bar.querySelector('[data-filter-apply]')?.addEventListener('click',()=>renderAdvancedModule(module));
   bar.querySelector('[data-filter-clear]')?.addEventListener('click',()=>clearAdvancedFilter(module));
   bar.querySelector('[data-filter-refresh]')?.addEventListener('click',async e=>{const b=e.currentTarget;loading(b,true);try{await refresh(module)}finally{loading(b,false)}});
   bar.querySelector('[data-filter-search]')?.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();renderAdvancedModule(module)}});
 });
}
// ===========================================================================
async function loadVehicles(){
 const j=await api('listar',{recurso:'VEHICULOS',limit:300});S.vehicles=j.rows||[];S.rows.VEHICULOS=S.vehicles;populateAdvancedFilter('vehiculos',S.vehicles);renderVehicles();fillVehicleSelect();
}
function renderVehicles(){
 const rows=advancedFilteredRows('vehiculos',S.vehicles||[]);
 $('vehiculosRows').innerHTML=rows.length?rows.map(x=>`<div class="card"><h4>${esc(x.patente)}</h4><p>${esc(x.marca||'')} ${esc(x.modelo||'')} ${esc(x.anio||'')}</p><p>KM: <strong>${Number(x.kilometraje||0).toLocaleString('es-CL')}</strong></p><p>VIN: ${esc(x.vin||'—')} · Combustible: ${esc(x.combustible||'—')}</p><span class="badge">${esc(x.estado||'ACTIVO')}</span><div class="life-actions"><button class="mini detail" data-life-vehicle="${esc(x.id)}">Hoja de vida</button>${permissionAllowed('MANTENCIONES','CREAR')?`<button class="mini edit" data-new-maintenance="${esc(x.id)}">+ Mantención</button>`:''}</div>${adminActions('vehiculo',x.id)}</div>`).join(''):'<p class="muted">No hay vehículos para los filtros seleccionados.</p>';
}
async function loadDrivers(){
 const j=await api('listar',{recurso:'CONDUCTORES',limit:300});S.drivers=j.rows||[];S.rows.CONDUCTORES=S.drivers;
 if(permissionAllowed('DOCUMENTOS','LEER')){try{const dj=await api('listar',{recurso:'DOCUMENTOS',limit:500});S.documents=dj.rows||[];S.rows.DOCUMENTOS=S.documents}catch(e){console.warn('[conductores][documentos]',e)}}
 populateAdvancedFilter('conductores',S.drivers);renderDrivers();fillDriverSelect();
}
function renderDrivers(){
 const rows=advancedFilteredRows('conductores',S.drivers||[]);
 $('conductoresRows').innerHTML=rows.length?rows.map(x=>{const docs=(S.documents||[]).filter(d=>String(d.conductor_id||'')===String(x.id)),states=docs.map(docComputedState),expired=states.filter(v=>v==='VENCIDO').length,warn=states.filter(v=>v==='POR_VENCER').length;return `<div class="card"><h4>${esc(x.nombre)}</h4><p>RUT: ${esc(x.rut||'')}</p><p>${esc(x.correo||'')} · ${esc(x.telefono||'')}</p><p>Licencia: ${esc(x.licencia_clase||'—')} ${x.licencia_vencimiento?'· vence '+esc(new Date(x.licencia_vencimiento).toLocaleDateString('es-CL')):''}</p><div class="driver-doc-actions"><span class="driver-doc-pill ${expired?'danger':warn?'warn':'ok'}">📄 ${docs.length} documento(s)${expired?` · ${expired} vencido(s)`:warn?` · ${warn} por vencer`:' · al día'}</span><button class="mini detail" data-driver-docs="${esc(x.id)}">Documentación</button></div><span class="badge">${esc(x.estado||'Activo')}</span><div class="life-actions"><button class="mini detail" data-life-driver="${esc(x.id)}">Hoja de vida</button>${x.usuario_id?`<span class="linked-user">✓ Usuario asociado</span>`:'<span class="linked-user pending">Sin usuario</span>'}</div>${adminActions('conductor',x.id)}</div>`}).join(''):'<p class="muted">No hay conductores para los filtros seleccionados.</p>';
}
async function ensureCatalogs(){if(!S.vehicles.length)await loadVehicles();if(!S.drivers.length)await loadDrivers()}
function invalidateSavedCheckin(){S.lastCheckinSaved=null;updateCheckinActionHub()}
function selectCheckinVehicle(id,fromUser=false){
 const input=$('ciVehicle');if(!input)return;if(fromUser&&String(input.value)!==String(id))invalidateSavedCheckin();input.value=id||'';
 document.querySelectorAll('[data-ci-vehicle]').forEach(b=>{const active=String(b.dataset.ciVehicle)===String(input.value);b.classList.toggle('selected',active);b.setAttribute('aria-pressed',String(active))});
 const vehicle=S.vehicles.find(v=>String(v.id)===String(input.value));if(fromUser&&vehicle&&(!$('ciKm').value||Number($('ciKm').value)===0))$('ciKm').value=Number(vehicle.kilometraje||0)||'';
 updateCheckinActionHub();
}
function selectCheckinDriver(id,fromUser=false){
 const input=$('ciDriver');if(!input)return;if(fromUser&&String(input.value)!==String(id))invalidateSavedCheckin();input.value=id||'';
 document.querySelectorAll('[data-ci-driver]').forEach(b=>{const active=String(b.dataset.ciDriver||'')===String(input.value);b.classList.toggle('selected',active);b.setAttribute('aria-pressed',String(active))});
 updateCheckinActionHub();
}
function fillVehicleSelect(){
 const input=$('ciVehicle'),box=$('ciVehicleCards');if(!input||!box)return;
 if(input.value&&!S.vehicles.some(v=>String(v.id)===String(input.value)))input.value='';
 if(!input.value&&S.vehicles.length===1)input.value=S.vehicles[0].id;
 box.innerHTML=S.vehicles.length?S.vehicles.map(v=>`<button class="checkin-choice-card vehicle-card ${String(v.id)===String(input.value)?'selected':''}" type="button" data-ci-vehicle="${esc(v.id)}" aria-pressed="${String(v.id)===String(input.value)}"><span class="choice-icon">🚙</span><span><strong>${esc(v.patente||'Sin patente')}</strong><small>${esc([v.marca,v.modelo].filter(Boolean).join(' ')||'Vehículo')}</small><em>${Number(v.kilometraje||0).toLocaleString('es-CL')} km</em></span><b>✓</b></button>`).join(''):'<div class="checkin-choice-empty">No hay vehículos disponibles para inspeccionar.</div>';
 box.querySelectorAll('[data-ci-vehicle]').forEach(b=>b.onclick=()=>selectCheckinVehicle(b.dataset.ciVehicle,true));
}
function fillDriverSelect(){
 const input=$('ciDriver'),box=$('ciDriverCards');if(!input||!box)return;
 if(input.value&&!S.drivers.some(v=>String(v.id)===String(input.value)))input.value='';
 const noneSelected=!input.value;
 box.innerHTML=`<button class="checkin-choice-card driver-card ${noneSelected?'selected':''}" type="button" data-ci-driver="" aria-pressed="${noneSelected}"><span class="choice-icon">—</span><span><strong>Sin conductor</strong><small>Inspección de la unidad</small></span><b>✓</b></button>`+S.drivers.map(d=>`<button class="checkin-choice-card driver-card ${String(d.id)===String(input.value)?'selected':''}" type="button" data-ci-driver="${esc(d.id)}" aria-pressed="${String(d.id)===String(input.value)}"><span class="choice-icon">👤</span><span><strong>${esc(d.nombre||'Conductor')}</strong><small>${esc(d.rut||d.licencia_clase||'Registro activo')}</small></span><b>✓</b></button>`).join('');
 box.querySelectorAll('[data-ci-driver]').forEach(b=>b.onclick=()=>selectCheckinDriver(b.dataset.ciDriver||'',true));
}
function renderChecklist(){
 const groups=[
  ['Seguridad crítica',[0,2,9,10,13]],
  ['Exterior y visibilidad',[1,3,4,5,17]],
  ['Motor y fluidos',[6,7,8,11,12]],
  ['Cabina y equipamiento',[14,15,16]]
 ];
 $('checklist').innerHTML=groups.map(([name,indexes],groupIndex)=>`<section class="check-group">
   <div class="check-group-title"><span>${groupIndex+1}</span><div><strong>${esc(name)}</strong><small>${name==='Seguridad crítica'?'Una falla crítica puede dejar el vehículo NO APTO.':'Selecciona la condición observada en cada punto.'}</small></div></div>
   <div class="check-group-items">${indexes.map(i=>{const x=CHECKS[i];return `<div class="check-item" data-check-card="${esc(x[0])}"><div class="check-item-head"><span><strong>${i+1}. ${esc(x[1])}</strong><small class="criticality ${String(x[2]).toLowerCase()}">${esc(x[2])}</small></span><span class="check-state-summary">Conforme</span></div><input type="hidden" data-check="${esc(x[0])}" data-name="${esc(x[1])}" data-critical="${esc(x[2])}" value="CONFORME"><div class="check-state-options" role="radiogroup" aria-label="Estado de ${esc(x[1])}"><button class="selected state-ok" type="button" data-check-option="${esc(x[0])}" data-check-state="CONFORME" aria-pressed="true">✓<span>Conforme</span></button><button class="state-watch" type="button" data-check-option="${esc(x[0])}" data-check-state="OBSERVACION" aria-pressed="false">◉<span>Observación</span></button><button class="state-fail" type="button" data-check-option="${esc(x[0])}" data-check-state="FALLA" aria-pressed="false">⚠<span>Falla</span></button></div></div>`}).join('')}</div>
  </section>`).join('');
 document.querySelectorAll('[data-check-option]').forEach(b=>b.onclick=()=>setCheckState(b.dataset.checkOption,b.dataset.checkState,true));calcResult();
}
function setCheckState(code,state,fromUser=false){
 const input=[...document.querySelectorAll('[data-check]')].find(x=>x.dataset.check===code);if(!input)return;if(fromUser&&input.value!==state)invalidateSavedCheckin();input.value=state;
 const card=input.closest('[data-check-card]');card?.querySelectorAll('[data-check-option]').forEach(b=>{const active=b.dataset.checkState===state;b.classList.toggle('selected',active);b.setAttribute('aria-pressed',String(active))});
 const summary=card?.querySelector('.check-state-summary');if(summary){summary.textContent=state==='OBSERVACION'?'Observación':state==='FALLA'?'Falla':'Conforme';summary.className='check-state-summary '+(state==='FALLA'?'danger':state==='OBSERVACION'?'warn':'ok')}
 calcResult();
}
function setAllCheckStates(state='CONFORME'){document.querySelectorAll('[data-check]').forEach(x=>setCheckState(x.dataset.check,state,false));invalidateSavedCheckin();calcResult()}
function calcResult(){
 let result='APTO',ok=0,observations=0,failures=0;document.querySelectorAll('[data-check]').forEach(s=>{if(s.value==='CONFORME')ok++;else if(s.value==='OBSERVACION')observations++;else failures++;if(s.value==='FALLA'&&s.dataset.critical==='CRITICA')result='NO APTO';else if(result!=='NO APTO'&&s.value!=='CONFORME')result='APTO CON OBSERVACIÓN'});
 $('ciResult').textContent=result;$('ciResultDetail').textContent=`${ok} conformes · ${observations} observaciones · ${failures} fallas`;
 $('ciResultBox').className='checkin-result '+(result==='NO APTO'?'result-danger':result.includes('OBSERVACIÓN')?'result-warn':'result-ok');
 updateCheckinActionHub();
 return result;
}

function checkinItemSnapshot(){return [...document.querySelectorAll('[data-check]')].map(x=>({codigo:x.dataset.check,nombre:x.dataset.name,criticidad:x.dataset.critical,estado:x.value}))}
function checkinSourceFromRow(row,extra={}){return{checkinId:row?.id||'',vehicleId:row?.vehiculo_id||'',driverId:row?.conductor_id||'',kilometraje:Number(row?.kilometraje||0),resultado:row?.resultado_tecnico||row?.estado||'',observacion:row?.observacion_general||'',failedItems:extra.failedItems||[],failureRows:extra.failureRows||[]}}
function updateCheckinActionHub(){
 const context=$('checkinActionContext'),failureCard=$('checkinFailureAction'),maintenanceCard=$('checkinMaintenanceAction'),failureOptions=$('checkinFailureOptions');if(!context||!failureCard||!maintenanceCard||!failureOptions)return;
 const saved=S.lastCheckinSaved,ready=Boolean(saved?.checkinId&&saved?.vehicleId),canFailure=permissionAllowed('FALLAS','REPORTAR'),canMaintenance=permissionAllowed('MANTENCIONES','CREAR');
 failureCard.classList.toggle('is-locked',!ready||!canFailure);maintenanceCard.classList.toggle('is-locked',!ready||!canMaintenance);
 context.textContent=ready?`${vehicleName(saved.vehicleId)} · Check-in guardado · las acciones quedarán vinculadas.`:'Guarda la inspección para vincular una falla o mantención.';
 const failed=saved?.failedItems?.filter(x=>x.estado==='FALLA')||[];
 failureOptions.innerHTML=(failed.length?failed.map(x=>`<button type="button" data-current-checkin-failure="${esc(x.codigo)}" ${ready&&canFailure?'':'disabled'}>⚠ ${esc(x.nombre)} · ${esc(x.criticidad)}</button>`).join(''):'')+`<button type="button" data-current-checkin-failure="ADICIONAL" ${ready&&canFailure?'':'disabled'}>+ Informar falla adicional</button>`;
 document.querySelectorAll('[data-current-checkin-maintenance]').forEach(b=>b.disabled=!ready||!canMaintenance);
}
function modalField(key){return $('modalBody')?.querySelector(`[data-field="${key}"]`)}
function setModalField(key,value){const field=modalField(key);if(field&&value!==undefined&&value!==null)field.value=String(value)}
function convertModalSelectToCards(key){
 const select=modalField(key);if(!select||select.tagName!=='SELECT'||select.nextElementSibling?.dataset?.cardSelect===key)return;select.classList.add('card-select-source');
 const options=document.createElement('div');options.className='modal-card-options';options.dataset.cardSelect=key;
 const render=()=>{options.innerHTML=[...select.options].map(o=>`<button type="button" class="${String(o.value)===String(select.value)?'selected':''}" data-card-select-value="${esc(o.value)}" aria-pressed="${String(o.value)===String(select.value)}">${esc(o.textContent)}</button>`).join('');options.querySelectorAll('[data-card-select-value]').forEach(b=>b.onclick=()=>{select.value=b.dataset.cardSelectValue;render()})};render();select.insertAdjacentElement('afterend',options);
}
function lockCheckinContextInModal(source,kind){
 const v=S.vehicles.find(x=>String(x.id)===String(source.vehicleId))||{},d=S.drivers.find(x=>String(x.id)===String(source.driverId))||{};
 for(const key of ['vehiculo_id','conductor_id'])modalField(key)?.closest('.form-field')?.classList.add('hidden');
 if(kind==='falla')modalField('origen')?.closest('.form-field')?.classList.add('hidden');
 const intro=$('modalBody')?.querySelector('.record-form-intro');intro?.insertAdjacentHTML('afterend',`<div class="checkin-linked-banner"><span>✓ VINCULADO AL CHECK-IN</span><strong>🚙 ${esc(v.patente||source.vehicleId)}${d.nombre?` · 👤 ${esc(d.nombre)}`:''}</strong><small>${Number(source.kilometraje||0).toLocaleString('es-CL')} km · ${esc(source.resultado||'Inspección registrada')} · ${esc(source.checkinId)}</small></div>`);
}
function faultSeverityFromItem(item){return item?.criticidad==='CRITICA'?'CRITICA':item?.criticidad==='ALTA'?'ALTA':item?.criticidad==='MEDIA'?'MEDIA':'BAJA'}
async function openCheckinFailure(source,code='ADICIONAL'){
 if(!source?.checkinId)return toast('Primero guarda el Check-in para mantener la trazabilidad.',true);
 if(!permissionAllowed('FALLAS','REPORTAR'))return toast('Tu perfil no tiene permiso para informar fallas.',true);
 const item=(source.failedItems||[]).find(x=>x.codigo===code),existing=(source.failureRows||[]).find(x=>x.codigo===code)?.row||null;
 await openForm('falla',existing);activeCheckinContext={...source,kind:'falla'};lockCheckinContextInModal(source,'falla');
 setModalField('vehiculo_id',source.vehicleId);setModalField('conductor_id',source.driverId);setModalField('origen','CHECKIN');setModalField('kilometraje',source.kilometraje);
 if(!existing){const severity=faultSeverityFromItem(item);setModalField('titulo',item?`Hallazgo Check-in: ${item.nombre}`:'Falla informada desde Check-in');setModalField('descripcion',item?`Condición marcada como Falla durante la inspección de ${item.nombre}. ${source.observacion||''}`:source.observacion||'Falla observada durante el Check-in técnico.');setModalField('severidad',severity);setModalField('criticidad',severity);setModalField('estado','DETECTADA');setModalField('puede_operar',severity==='CRITICA'?'NO':'SI');setModalField('requiere_inmovilizacion',severity==='CRITICA'?'SI':'NO')}
 for(const key of ['severidad','criticidad','estado','puede_operar','requiere_inmovilizacion'])convertModalSelectToCards(key);
 $('modalTitle').textContent=existing?'Completar informe de falla':'Informar falla desde Check-in';
}
async function openCheckinMaintenance(source,type='CORRECTIVA'){
 if(!source?.checkinId)return toast('Primero guarda el Check-in para mantener la trazabilidad.',true);
 if(!permissionAllowed('MANTENCIONES','CREAR'))return toast('Tu perfil no tiene permiso para programar mantenciones.',true);
 await openForm('mantencion');activeCheckinContext={...source,kind:'mantencion'};lockCheckinContextInModal(source,'mantencion');setModalField('vehiculo_id',source.vehicleId);setModalField('tipo',type);setModalField('estado','PROGRAMADA');setModalField('kilometraje_programado',source.kilometraje);
 const findings=(source.failedItems||[]).filter(x=>x.estado!=='CONFORME').map(x=>x.nombre).join(', ');setModalField('descripcion',findings?`Revisión por hallazgos de Check-in: ${findings}`:`Mantención ${String(type).toLowerCase()} programada desde Check-in`);setModalField('observaciones',`Origen Check-in ${source.checkinId}. Resultado: ${source.resultado||'registrado'}. ${source.observacion||''}`.trim());for(const key of ['tipo','estado'])convertModalSelectToCards(key);$('modalTitle').textContent=`Programar mantención ${String(type).toLowerCase()}`;
}
function openHistoricalCheckinAction(id,kind,type){const row=(S.rows.CHECKINS||[]).find(x=>String(x.id)===String(id));if(!row)return toast('Check-in no encontrado',true);const source=checkinSourceFromRow(row);return kind==='falla'?openCheckinFailure(source,'ADICIONAL'):openCheckinMaintenance(source,type||'CORRECTIVA')}
function resetCheckinWorkspace(){S.lastCheckinSaved=null;$('ciVehicle').value='';$('ciDriver').value='';$('ciKm').value='';$('ciObs').value='';if($('ciEvidenceFiles'))$('ciEvidenceFiles').value='';if($('ciEvidenceHint'))$('ciEvidenceHint').textContent='0 archivos seleccionados';fillVehicleSelect();fillDriverSelect();document.querySelectorAll('[data-check]').forEach(x=>setCheckState(x.dataset.check,'CONFORME',false));calcResult();$('ciVehicleCards')?.scrollIntoView({behavior:'smooth',block:'center'});updateCheckinActionHub()}

let qrState=null,qrTimer=null;
async function generateCheckinQr(){
 if(!permissionAllowed('CHECKIN','GENERAR_QR'))return toast('Tu perfil no tiene permiso para generar el QR',true);
 const vehicleId=$('ciVehicle').value;if(!vehicleId)return toast('Selecciona primero el vehículo',true);
 const button=$('btnGenerateCheckinQr');loading(button,true);
 try{
  const j=await api('GENERAR_QR_CHECKIN',{vehiculo_id:vehicleId});
  if(!j.qrValue)throw new Error('QR_NO_GENERADO');
  qrState={...j,vehicleId};const box=$('checkinQrCode');box.innerHTML='';
  if(typeof QRCode!=='function')throw new Error('MOTOR_QR_NO_DISPONIBLE');
  new QRCode(box,{text:j.qrValue,width:264,height:264,colorDark:'#101828',colorLight:'#ffffff',correctLevel:QRCode.CorrectLevel.H});
  $('qrVehicleName').textContent=(j.vehiculo?.patente||vehicleName(vehicleId))+' · '+[j.vehiculo?.marca,j.vehiculo?.modelo].filter(Boolean).join(' ');
  openOverlay('qrModal');startQrCountdown(j.expiraEn||j.expiresAt);
 }catch(e){toast('No fue posible generar el QR: '+e.message,true)}finally{loading(button,false)}
}
function startQrCountdown(expiresAt){
 if(qrTimer)clearInterval(qrTimer);const expires=new Date(expiresAt).getTime();
 const tick=()=>{const left=Math.max(0,expires-Date.now()),m=Math.floor(left/60000),s=Math.floor((left%60000)/1000);$('qrExpiry').textContent=left>0?`Vence en ${m}:${String(s).padStart(2,'0')}`:'QR vencido · genera uno nuevo';if(left<=0){clearInterval(qrTimer);qrTimer=null}};
 tick();qrTimer=setInterval(tick,1000);
}
function qrDataUrl(){const canvas=$('checkinQrCode').querySelector('canvas');if(canvas)return canvas.toDataURL('image/png');return $('checkinQrCode').querySelector('img')?.src||''}
function downloadCheckinQr(){const data=qrDataUrl();if(!data)return toast('El QR todavía no está listo',true);const a=document.createElement('a');a.href=data;a.download='E-Fleet-QR-Checkin-'+String($('qrVehicleName').textContent||'vehiculo').split('·')[0].trim().replace(/[^A-Za-z0-9_-]/g,'')+'.png';a.click()}
function printCheckinQr(){const data=qrDataUrl();if(!data)return toast('El QR todavía no está listo',true);const w=window.open('','_blank','width=620,height=760');if(!w)return toast('Permite ventanas emergentes para imprimir',true);w.document.write(`<!doctype html><html><head><title>QR Check-in E-Fleet</title><style>body{font-family:Arial;text-align:center;padding:34px;color:#101828}.sheet{border:2px solid #101828;border-radius:22px;padding:28px}img{width:320px;height:320px}.tag{font-weight:900;letter-spacing:1px}.muted{color:#667085}</style></head><body><div class="sheet"><div class="tag">E-FLEET · CHECK-IN TÉCNICO</div><h1>${esc($('qrVehicleName').textContent)}</h1><img src="${data}"><h2>QR temporal · 15 minutos</h2><p class="muted">Empresa: ${esc(S.company?.nombre||'')}</p></div><script>onload=()=>{print();setTimeout(()=>close(),500)}<\/script></body></html>`);w.document.close()}
function closeCheckinQr(){if(qrTimer){clearInterval(qrTimer);qrTimer=null}$('qrModal').classList.add('hidden')}


async function loadCompanyModule(render=true){
 try{
  const j=await api('CONFIGURACION_EMPRESA',{},true),c=j.row||{};S.companyConfig=c;
  const name=c.nombre_fantasia||c.razon_social||S.company?.nombre||'Empresa';
  if($('companyNameHeader'))$('companyNameHeader').textContent=name;
  const logo=c.logoUrl||c.logo_url||'';
  if($('companyLogoHeader')){if(logo){$('companyLogoHeader').src=logo;$('companyLogoHeader').classList.remove('hidden')}else $('companyLogoHeader').classList.add('hidden')}
  if(!render||!$('companyDisplayName'))return;
  $('companyDisplayName').textContent=name;$('companyDisplayRut').textContent=S.company?.rut||'';$('companyStateBadge').textContent=S.company?.estado||'ACTIVA';
  if(logo){$('companyLogoPreview').src=logo;$('companyLogoPreview').classList.remove('hidden');$('companyLogoPlaceholder').classList.add('hidden')}else{$('companyLogoPreview').classList.add('hidden');$('companyLogoPlaceholder').classList.remove('hidden')}
  $('companyLegalName').value=c.razon_social||S.company?.nombre||'';$('companyTradeName').value=c.nombre_fantasia||'';$('companyAddress').value=c.direccion||'';$('companyPhone').value=c.telefono||'';$('companyEmail').value=c.correo||'';
  $('companySpeedAlert').value=c.limite_velocidad_alerta_kmh??90;$('companySpeedExcess').value=c.limite_velocidad_exceso_kmh??100;$('companyMaintenanceWarn').value=c.alerta_mantencion_preventiva_km??1000;$('companyMaintenanceUrgent').value=c.alerta_mantencion_urgente_km??500;
  const editable=permissionAllowed('EMPRESA','EDITAR')&&isManagement();document.querySelectorAll('#view-empresa input').forEach(x=>{if(x.id!=='companyLogoFile')x.disabled=!editable});$('btnSaveCompany').classList.toggle('hidden',!editable);$('btnCompanyLogo').classList.toggle('hidden',!permissionAllowed('EMPRESA','LOGO')||!isManagement());
 }catch(e){console.warn('empresa',e);if(render)toast('Empresa: '+e.message,true)}
}
async function saveCompanyModule(){const b=$('btnSaveCompany');loading(b,true);try{await api('GUARDAR_CONFIGURACION_EMPRESA',{row:{razon_social:$('companyLegalName').value,nombre_fantasia:$('companyTradeName').value,direccion:$('companyAddress').value,telefono:$('companyPhone').value,correo:$('companyEmail').value,limite_velocidad_alerta_kmh:Number($('companySpeedAlert').value||0),limite_velocidad_exceso_kmh:Number($('companySpeedExcess').value||0),alerta_mantencion_preventiva_km:Number($('companyMaintenanceWarn').value||0),alerta_mantencion_urgente_km:Number($('companyMaintenanceUrgent').value||0)}});toast('Datos de empresa guardados');await loadCompanyModule()}catch(e){toast('Empresa: '+e.message,true)}finally{loading(b,false)}}
async function uploadCompanyLogo(file){if(!file)return;const b=$('btnCompanyLogo');loading(b,true);try{if(file.size>5*1024*1024)throw new Error('LOGO_MAXIMO_5MB');const base64=await fileToBase64(file);await api('SUBIR_LOGO_EMPRESA',{base64,mime:file.type,nombreArchivo:file.name});toast('Logo de empresa actualizado');await loadCompanyModule()}catch(e){toast('Logo: '+e.message,true)}finally{loading(b,false);$('companyLogoFile').value=''}}

async function openCheckinSchedule(){
 await ensureCatalogs();$('modalTitle').textContent='Programar Check-in';activeForm=null;activeRecord=null;
 const defaultDate=new Date(Date.now()+3600000);defaultDate.setMinutes(0,0,0);const local=new Date(defaultDate.getTime()-defaultDate.getTimezoneOffset()*60000).toISOString().slice(0,16);
 $('modalBody').innerHTML=`<div class="record-form-intro"><span>PROGRAMACIÓN</span><p>Agenda el Check-in desde su módulo protagonista.</p></div><div class="record-form-grid"><div class="form-field"><label>Vehículo</label><select id="scheduleVehicle">${S.vehicles.map(v=>`<option value="${esc(v.id)}">${esc(v.patente)} · ${esc(v.marca||'')} ${esc(v.modelo||'')}</option>`).join('')}</select></div><div class="form-field"><label>Conductor</label><select id="scheduleDriver"><option value="">Sin conductor</option>${S.drivers.map(d=>`<option value="${esc(d.id)}">${esc(d.nombre)}</option>`).join('')}</select></div><div class="form-field"><label>Fecha y hora</label><input id="scheduleAt" type="datetime-local" value="${local}"></div><div class="form-field form-span-full"><label>Instrucciones</label><textarea id="scheduleNotes" rows="3" placeholder="Motivo, lugar o indicaciones"></textarea></div></div>`;
 $('modalSave').classList.remove('hidden');$('modalSave').textContent='Programar Check-in';$('modalSave').onclick=saveCheckinSchedule;openOverlay('modal');
}
async function saveCheckinSchedule(){const b=$('modalSave');loading(b,true);try{const veh=$('scheduleVehicle').value,driver=$('scheduleDriver').value||null,at=$('scheduleAt').value;if(!veh||!at)throw new Error('VEHICULO_Y_FECHA_REQUERIDOS');const iso=new Date(at).toISOString();await api('guardar',{recurso:'CHECKIN_PROGRAMACIONES',row:{id:'CIP-'+crypto.randomUUID().toUpperCase(),vehiculo_id:veh,conductor_id:driver,programado_para:iso,estado:'PROGRAMADO',observaciones:$('scheduleNotes').value}});closeModal();toast('Check-in programado');await loadCheckin()}catch(e){toast('Programación: '+e.message,true)}finally{loading(b,false)}}
async function uploadCheckinEvidenceFiles(checkinId,vehicleId){
 const files=[...($('ciEvidenceFiles')?.files||[])].slice(0,8);let uploaded=0,failed=[];
 for(const file of files){
  try{
   if(file.size>12*1024*1024)throw new Error('ARCHIVO_MAXIMO_12MB');
   const base64=await fileToBase64(file);await api('SUBIR_EVIDENCIA_CHECKIN',{checkin_id:checkinId,vehiculo_id:vehicleId,base64,mime:file.type,nombreArchivo:file.name,tipo:file.type==='application/pdf'?'PDF':'FOTO'});uploaded++;
  }catch(e){failed.push({nombre:file.name,error:String(e.message||e)});console.warn('[checkin][evidencia no bloqueante]',file.name,e)}
 }
 return{uploaded,failed,total:files.length};
}
async function openCheckinEvidence(id){try{const j=await api('VER_EVIDENCIA_CHECKIN',{id});if(!j.url)throw new Error('EVIDENCIA_NO_DISPONIBLE');window.open(j.url,'_blank','noopener')}catch(e){toast('Evidencia: '+e.message,true)}}

async function loadCheckinHistory(){
 await ensureCatalogs();let j;
 try{j=await api('listar',{recurso:'HISTORIAL_CHECKIN',limit:500})}
 catch(e){if(['RECURSO_NO_DISPONIBLE','ACCION_NO_DISPONIBLE'].includes(String(e.message||'').toUpperCase()))j=await api('listar',{recurso:'CHECKINS',limit:500});else throw e}
 S.checkinHistory=j.rows||[];const sel=$('checkinHistoryVehicle'),keep=sel?.value||'';if(sel){sel.innerHTML='<option value="">Todos los vehículos</option>'+S.vehicles.map(v=>`<option value="${esc(v.id)}">${esc(v.patente)}</option>`).join('');sel.value=keep}populateAdvancedFilter('checkinhistorial',S.checkinHistory);renderCheckinHistory();
}
function filteredCheckinHistory(){return advancedFilteredRows('checkinhistorial',S.checkinHistory||[])}
function renderCheckinHistory(){const rows=filteredCheckinHistory(),approved=rows.filter(x=>String(x.estado||'').toUpperCase()==='APROBADO'||String(x.aprobacion_directa||'').toUpperCase()==='SI').length,noApto=rows.filter(x=>String(x.resultado_tecnico||'').toUpperCase().includes('NO APTO')).length;$('checkinHistoryKpis').innerHTML=ringKpi('Inspecciones',rows.length,Math.min(100,rows.length*2),'blue','Historial filtrado')+ringKpi('Aprobados',approved,rows.length?approved/rows.length*100:0,'green','Operacionales')+ringKpi('No aptos',noApto,rows.length?noApto/rows.length*100:0,noApto?'red':'green','Requieren atención');$('checkinHistoryRows').innerHTML=rows.length?rows.map(checkinHistoryCard).join(''):'<div class="notification-empty">No hay Check-in para los filtros seleccionados.</div>'}
function checkinHistoryCard(x){const v=S.vehicles.find(v=>v.id===x.vehiculo_id)||{},d=S.drivers.find(d=>d.id===x.conductor_id)||{},vehicleLabel=x.vehiculo_patente||v.patente||'Vehículo asociado',driverLabel=x.conductor_nombre||d.nombre||'Sin conductor',approved=String(x.estado||'').toUpperCase()==='APROBADO'||String(x.aprobacion_directa||'').toUpperCase()==='SI';return `<article class="history-check-card"><div class="history-check-head"><div><strong>${esc(vehicleLabel)}</strong><small>${esc(driverLabel)}</small></div><span class="badge ${String(x.resultado_tecnico||'').includes('NO APTO')?'danger':String(x.resultado_tecnico||'').includes('OBS')?'warn':'ok'}">${esc(x.resultado_tecnico||x.estado||'PENDIENTE')}</span></div><div class="history-check-grid"><span><small>Fecha</small><strong>${esc(x.fecha_inicio?new Date(x.fecha_inicio).toLocaleString('es-CL'):'—')}</strong></span><span><small>KM</small><strong>${Number(x.kilometraje||0).toLocaleString('es-CL')}</strong></span><span><small>Aprobación</small><strong>${approved?'APROBADO':'PENDIENTE'}</strong></span></div><p>${esc(x.observacion_general||'Sin observación general')}</p><div class="card-actions"><button class="mini detail" data-checkin-detail="${esc(x.id)}">Ver inspección</button><button class="mini detail" data-checkin-pdf="${esc(x.id)}">PDF</button>${permissionAllowed('CHECKIN','APROBAR_DIRECTO')&&!approved?`<button class="mini approve" data-approve-checkin="${esc(x.id)}">✓ Aprobar directo</button>`:''}</div></article>`}
async function loadCheckinApprovals(){if(!isManagement())return showView('checkin');await ensureCatalogs();const j=await api('listar',{recurso:'CHECKINS',limit:500});S.checkinHistory=j.rows||[];populateAdvancedFilter('checkinaprobaciones',S.checkinHistory);renderCheckinApprovals()}
function renderCheckinApprovals(){const all=(S.checkinHistory||[]).filter(x=>!(String(x.estado||'').toUpperCase()==='APROBADO'||String(x.aprobacion_directa||'').toUpperCase()==='SI')),rows=advancedFilteredRows('checkinaprobaciones',all),noApto=rows.filter(x=>String(x.resultado_tecnico||'').toUpperCase().includes('NO APTO')).length;$('checkinApprovalKpis').innerHTML=ringKpi('Pendientes',rows.length,Math.min(100,rows.length*8),'amber','Por revisar')+ringKpi('No aptos',noApto,rows.length?noApto/rows.length*100:0,noApto?'red':'green','Resultado técnico conservado');$('checkinApprovalRows').innerHTML=rows.length?rows.map(checkinHistoryCard).join(''):'<div class="notification-empty">No hay Check-in pendientes para estos filtros.</div>'}

async function loadWorkshops(){const j=await api('listar',{recurso:'TALLERES',limit:300});S.talleres=j.rows||[];S.rows.TALLERES=S.talleres;populateAdvancedFilter('talleres',S.talleres);renderWorkshops()}
function renderWorkshops(){const rows=advancedFilteredRows('talleres',S.talleres||[]),active=rows.filter(x=>String(x.estado||'').toUpperCase()==='ACTIVO').length,avg=rows.length?rows.reduce((a,x)=>a+Number(x.calidad_porcentaje||100),0)/rows.length:0;$('workshopKpis').innerHTML=ringKpi('Talleres',rows.length,Math.min(100,rows.length*10),'blue','Filtrados')+ringKpi('Activos',active,rows.length?active/rows.length*100:0,'green','Disponibles')+ringKpi('Calidad promedio',`${Math.round(avg)}%`,avg,avg<70?'red':avg<85?'amber':'green','Reparación');$('talleresRows').innerHTML=rows.length?rows.map(x=>`<article class="workshop-card"><div class="workshop-head"><span>🏭</span><div><h4>${esc(x.nombre)}</h4><p>${esc(x.especialidad||'Taller general')}</p></div><span class="badge ${String(x.estado).toUpperCase()==='ACTIVO'?'ok':'warn'}">${esc(x.estado||'ACTIVO')}</span></div><div class="workshop-info"><span class="workshop-address"><small>DIRECCIÓN</small><strong>${esc(x.direccion_normalizada||x.direccion||'Sin dirección')}</strong>${x.comuna||x.ciudad?`<em>${esc([x.comuna,x.ciudad].filter(Boolean).join(' · '))}</em>`:''}</span><span><small>TELÉFONO</small><strong>${esc(x.telefono||'—')}</strong></span><span><small>CONTACTO</small><strong>${esc(x.contacto||x.correo||'—')}</strong></span><span><small>CALIDAD</small><strong>${Number(x.calidad_porcentaje||100).toLocaleString('es-CL')}%</strong></span></div><div class="card-actions"><button class="mini detail" data-workshop-map="${esc(x.id)}">📍 Ver ubicación</button></div>${adminActions('taller',x.id)}</article>`).join(''):'<div class="notification-empty">No hay talleres para los filtros seleccionados.</div>'}
function openWorkshopMap(id){const t=S.talleres.find(x=>String(x.id)===String(id));if(!t)return;const q=(t.latitud!=null&&t.longitud!=null)?`${t.latitud},${t.longitud}`:(t.direccion||t.nombre);window.open('https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(q),'_blank','noopener')}

function currentViewRows(){const v=document.querySelector('#nav button.active')?.dataset.view||'dashboard';const maps={vehiculos:advancedFilteredRows('vehiculos',S.vehicles),conductores:advancedFilteredRows('conductores',S.drivers),asignaciones:advancedFilteredRows('asignaciones',S.assignments||[]),documentos:advancedFilteredRows('documentos',S.documents||[]),checkin:S.rows.CHECKINS||[],checkinhistorial:filteredCheckinHistory(),checkinaprobaciones:advancedFilteredRows('checkinaprobaciones',(S.checkinHistory||[]).filter(x=>!(String(x.estado||'').toUpperCase()==='APROBADO'||String(x.aprobacion_directa||'').toUpperCase()==='SI'))),fallas:advancedFilteredRows('fallas',S.rows.FALLAS||[]),mantenciones:advancedFilteredRows('mantenciones',S.rows.MANTENCIONES||[]),ordenes:advancedFilteredRows('ordenes',S.orders||S.rows.ORDENES_TRABAJO||[]),historial:advancedFilteredRows('historial',S.history||S.rows.MANTENCIONES||[]),talleres:advancedFilteredRows('talleres',S.talleres||[]),predicciones:advancedFilteredRows('predicciones',S.rows.PREDICCIONES||[]),notificaciones:advancedFilteredRows('notificaciones',S.notifications||[]),combustible:advancedFilteredRows('combustible',S.rows.COMBUSTIBLE||[]),usuarios:advancedFilteredRows('usuarios',S.users||[]),reportes:S.reportRows||[],perfiles:S.roleProfiles||[],empresa:S.companyConfig?[S.companyConfig]:[]};return{view:v,rows:(maps[v]||[]).map(reportNormalizeRow)}}
function exportCurrentView(kind){const {view,rows}=currentViewRows();if(!rows.length)return toast('Este módulo no tiene datos cargados para exportar',true);const title=(document.querySelector('#nav button.active')?.textContent||view).replace(/^\S+\s*/,'').trim(),stamp=new Date().toISOString().slice(0,10),file=`E-Fleet_${title.replace(/[^A-Za-z0-9ÁÉÍÓÚáéíóúÑñ]+/g,'_')}_${stamp}`;S.reportRows=rows;if(kind==='XLSX')EFleetExport.toXlsx(file+'.xlsx',reportExportRows(),title.slice(0,28));else EFleetExport.toPdf(file+'.pdf',`E-Fleet · ${title}`,reportExportRows(),`${S.company?.nombre||''} · ${S.company?.rut||''}`)}


async function downloadCheckinPdf(id){const row=(S.rows.CHECKINS||S.checkinHistory||[]).find(x=>String(x.id)===String(id))||(S.checkinHistory||[]).find(x=>String(x.id)===String(id));if(!row)return toast('Check-in no encontrado',true);try{const it=await api('listar',{recurso:'CHECKIN_ITEMS',checkin_id:id,limit:100});const v=S.vehicles.find(v=>v.id===row.vehiculo_id)||{},d=S.drivers.find(d=>d.id===row.conductor_id)||{},rows=[{Punto:'RESUMEN',Estado:row.resultado_tecnico||row.estado,Detalle:`${row.vehiculo_patente||v.patente||'Vehículo asociado'} · ${row.conductor_nombre||d.nombre||'Sin conductor'} · ${Number(row.kilometraje||0).toLocaleString('es-CL')} km`},...(it.rows||[]).map(x=>({Punto:x.nombre||x.codigo,Estado:x.estado,Detalle:x.observacion||x.criticidad||''}))];EFleetExport.toPdf(`E-Fleet_Checkin_${String(v.patente||id).replace(/[^A-Za-z0-9_-]/g,'')}.pdf`,'E-Fleet · Informe de Check-in',rows,`${S.company?.nombre||''} · ${row.fecha_inicio?new Date(row.fecha_inicio).toLocaleString('es-CL'):''}`)}catch(e){toast('PDF Check-in: '+e.message,true)}}

const REPORT_LABELS={CHECKINS:'Check-in',MANTENCIONES:'Mantenciones',ORDENES_TRABAJO:'Órdenes de servicio',FALLAS:'Fallas',TALLERES:'Talleres',VEHICULOS:'Vehículos',COMBUSTIBLE:'Combustible',USUARIOS:'Usuarios'};
async function loadReports(){if(!S.companyConfig)await loadCompanyModule(false);const type=$('reportType')?.value||'CHECKINS';if(type==='USUARIOS'&&!isManagement()){$('reportType').value='CHECKINS';return loadReports()}await ensureCatalogs();if(isManagement()&&!S.users.length){try{const u=await api('listar',{recurso:'USUARIOS',limit:500});S.users=u.rows||[]}catch{}}if(!S.talleres.length){try{const t=await api('listar',{recurso:'TALLERES',limit:500});S.talleres=t.rows||[]}catch{}}const j=await api('listar',{recurso:type,limit:500});S.reportRows=(j.rows||[]).map(reportNormalizeRow);populateAdvancedFilter('reportes',S.reportRows);renderReport()}
function userName(id){if(!id)return'';if(String(id)===String(S.user?.id||''))return S.user?.nombre||'Usuario actual';const u=S.users.find(u=>String(u.id)===String(id));return u?.nombre||'Usuario asociado'}
function driverName(id){if(!id)return'';const d=S.drivers.find(d=>String(d.id)===String(id));return d?.nombre||'Conductor asociado'}
function workshopName(id){if(!id)return'';const t=S.talleres.find(t=>String(t.id)===String(id));return t?.nombre||'Taller asociado'}
function reportNormalizeRow(x){
 const out={...x};
 if(out.vehiculo_id){out.vehiculo=out.vehiculo_patente||vehicleName(out.vehiculo_id);delete out.vehiculo_id}
 if(out.conductor_id){out.conductor=out.conductor_nombre||driverName(out.conductor_id);delete out.conductor_id}
 if(out.usuario_id){out.usuario=out.usuario_nombre||userName(out.usuario_id);delete out.usuario_id}
 if(out.creado_por){out.creado_por_nombre=out.creado_por_nombre||userName(out.creado_por);delete out.creado_por}
 if(out.aprobado_por){out.aprobado_por_nombre=out.aprobado_por_nombre||userName(out.aprobado_por);delete out.aprobado_por}
 if(out.taller_id){out.taller=out.taller_nombre||workshopName(out.taller_id);delete out.taller_id}
 delete out.empresa_id;delete out.eliminado;delete out.permisos_personalizados;delete out.permisosRol;
 for(const k of Object.keys(out)){if(/(^id$|_id$)/i.test(k))delete out[k]}
 return out
}
function renderReport(){const rows=advancedFilteredRows('reportes',S.reportRows||[]),type=$('reportType').value,keys=rows.length?Object.keys(rows[0]).slice(0,12):[];$('reportKpis').innerHTML=ringKpi('Registros',rows.length,Math.min(100,rows.length/5),'blue',REPORT_LABELS[type])+ringKpi('Exportación','PDF + XLSX',100,'green','Formato ejecutivo');$('reportTable').innerHTML=rows.length?`<table><thead><tr>${keys.map(k=>`<th>${esc(k.replaceAll('_',' '))}</th>`).join('')}</tr></thead><tbody>${rows.slice(0,200).map(r=>`<tr>${keys.map(k=>`<td>${esc(formatReportValue(r[k]))}</td>`).join('')}</tr>`).join('')}</tbody></table>`:'<div class="notification-empty">Sin datos para este informe.</div>'}
function formatReportValue(v){if(v==null)return '';if(typeof v==='object')return JSON.stringify(v);if(typeof v==='string'&&/^\d{4}-\d\d-\d\dT/.test(v)){const d=new Date(v);if(!Number.isNaN(d.getTime()))return d.toLocaleString('es-CL')}return String(v)}
function reportExportRows(){return advancedFilteredRows('reportes',S.reportRows||[]).map(r=>Object.fromEntries(Object.entries(r).map(([k,v])=>[k,formatReportValue(v)])))}
function exportCurrentReport(kind){const type=$('reportType').value,label=REPORT_LABELS[type]||type,rows=reportExportRows(),stamp=new Date().toISOString().slice(0,10),filename=`E-Fleet_${label.replace(/\s+/g,'_')}_${stamp}`;if(!rows.length)return toast('No hay datos para exportar',true);if(kind==='XLSX')EFleetExport.toXlsx(filename+'.xlsx',rows,label.slice(0,28));else EFleetExport.toPdf(filename+'.pdf',`E-Fleet · ${label}`,rows,`${S.company?.nombre||''} · ${S.company?.rut||''}`)}

async function loadUsers(){
 if(!isManagement())return showView('dashboard');
 const [conductores,j]=await Promise.all([api('listar',{recurso:'CONDUCTORES',limit:300}),api('listar',{recurso:'USUARIOS',limit:300})]);S.drivers=conductores.rows||[];S.rows.CONDUCTORES=S.drivers;S.users=j.rows||[];S.rows.USUARIOS=S.users;populateAdvancedFilter('usuarios',S.users);renderUsers();
}
function filteredUsers(){return advancedFilteredRows('usuarios',S.users||[])}
function renderUsers(){
 const rows=filteredUsers(),all=S.users||[],active=all.filter(u=>String(u.estado).toUpperCase()==='ACTIVO').length,admins=all.filter(u=>normalizeRole(u.rol_id)==='ROL-ADMIN').length,management=all.filter(u=>normalizeRole(u.rol_id)==='ROL-GERENCIA').length;
 $('userKpis').innerHTML=`<div><small>Total</small><strong>${all.length}</strong></div><div><small>Activos</small><strong>${active}</strong></div><div><small>Administradores</small><strong>${admins}</strong></div><div><small>Gerencia</small><strong>${management}</strong></div><div><small>Filtrados</small><strong>${rows.length}</strong></div>`;
 $('userRows').innerHTML=rows.length?rows.map(u=>{const linked=S.drivers.find(c=>String(c.usuario_id)===String(u.id));return `<article class="user-card"><div class="user-card-head"><span class="user-avatar">${esc(initials(u.nombre))}</span><div><h4>${esc(u.nombre)}</h4><p>${esc(u.correo)}</p></div><span class="badge ${String(u.estado).toUpperCase()==='ACTIVO'?'ok':'warn'}">${esc(u.estado)}</span></div><div class="user-details"><span><small>PERFIL</small><strong>${esc(roleLabel(u.rol_id))}</strong></span><span><small>PERMISOS</small><strong>${esc(u.modo_permisos||'ROL')}</strong></span><span><small>CONDUCTOR</small><strong>${esc(linked?.nombre||'Sin asociación')}</strong></span><span><small>ÚLTIMO ACCESO</small><strong>${esc(u.ultimo_acceso?new Date(u.ultimo_acceso).toLocaleString('es-CL'):'Sin acceso')}</strong></span></div><div class="card-actions"><button class="mini permissions" data-user-permissions="${esc(u.id)}">▦ Configurar permisos</button><button class="mini edit" data-edit-form="usuario" data-id="${esc(u.id)}">✎ Editar</button>${String(u.id)!==String(S.user?.id)?`<button class="mini danger" data-delete-form="usuario" data-id="${esc(u.id)}">Eliminar</button>`:''}</div></article>`}).join(''):'<div class="notification-empty">No existen usuarios para los filtros seleccionados.</div>';
}
let permissionUser=null,permissionRole=null,permissionDraft={};
function effectiveMatrixFor(user){const out={};for(const m of PERMISSION_MODULES){out[m.id]={};for(const a of m.actions)out[m.id][a]=permissionAllowed(m.id,a,user)}return out}
function permissionActionLabel(a){return({LEER:'Leer',CREAR:'Crear',EDITAR:'Editar',ELIMINAR:'Eliminar',ACEPTAR:'Aceptar',REPORTAR:'Reportar',GESTIONAR:'Gestionar',APROBAR_DIRECTO:'Aprobar directo',GENERAR_QR:'Generar QR',USAR:'Usar NEXO',MARCAR_LEIDA:'Marcar leída',PERMISOS:'Administrar permisos'})[a]||a.replaceAll('_',' ')}
function renderPermissionMatrix(){
 const isRole=Boolean(permissionRole),isTargetAdmin=normalizeRole(permissionUser?.rol_id)==='ROL-ADMIN',mode=isRole?'PERSONALIZADO':$('permissionMode').value;
 $('permissionMode').value=mode;$('permissionMode').disabled=isRole||isTargetAdmin;$('permissionTools').classList.toggle('hidden',isTargetAdmin);
 $('permissionHelp').textContent=isTargetAdmin?'ROL-ADMIN es irreductible y conserva autoridad total.':isRole?'Esta es la matriz base exclusiva de este perfil. Los cambios actualizan sus sesiones activas.':mode==='PERSONALIZADO'?'La matriz personalizada es autoritativa; una matriz vacía permanece vacía.':'Se muestra la base del perfil. Al tocar una casilla cambia a PERSONALIZADO.';
 const source=(isRole||mode==='PERSONALIZADO')?permissionDraft:effectiveMatrixFor(permissionUser);
 $('permissionMatrix').innerHTML=PERMISSION_MODULES.map(m=>`<section class="permission-module"><div><strong>${esc(m.label)}</strong><small>${esc(m.id)}</small></div><div class="permission-actions">${m.actions.map(a=>`<label><input type="checkbox" data-permission-module="${esc(m.id)}" data-permission-action="${esc(a)}" ${source?.[m.id]?.[a]?'checked':''} ${isTargetAdmin?'disabled':''}><span>${esc(permissionActionLabel(a))}</span></label>`).join('')}</div></section>`).join('');
 $('permissionMatrix').querySelectorAll('[data-permission-module]').forEach(box=>box.onchange=()=>{if(!isRole&&$('permissionMode').value==='ROL'){$('permissionMode').value='PERSONALIZADO';permissionDraft=effectiveMatrixFor(permissionUser)}permissionDraft[box.dataset.permissionModule]??={};permissionDraft[box.dataset.permissionModule][box.dataset.permissionAction]=box.checked;renderPermissionMatrix()});
}
function openUserPermissions(id){
 permissionRole=null;permissionUser=S.users.find(u=>String(u.id)===String(id));if(!permissionUser)return;
 $('permissionTitle').textContent='Permisos del usuario';$('permissionUserLabel').textContent=`${permissionUser.nombre} · ${roleLabel(permissionUser.rol_id)}`;
 const existing=personalPermissions(permissionUser);permissionDraft={};for(const m of PERMISSION_MODULES){permissionDraft[m.id]={};for(const a of m.actions)permissionDraft[m.id][a]=existing?.[m.id]?.[a]===true}
 $('permissionMode').value=normalizeRole(permissionUser.rol_id)==='ROL-ADMIN'?'ROL':String(permissionUser.modo_permisos||'ROL').toUpperCase();renderPermissionMatrix();openOverlay('permissionModal');
}
function openRolePermissions(id){
 permissionRole=S.roleProfiles.find(x=>String(x.id)===String(id));if(!permissionRole)return;permissionUser={rol_id:permissionRole.id};permissionDraft={};
 for(const m of PERMISSION_MODULES){permissionDraft[m.id]={};for(const a of m.actions)permissionDraft[m.id][a]=permissionRole.permisos?.[m.id]?.[a]===true}
 $('permissionTitle').textContent=`Perfil ${permissionRole.nombre}`;$('permissionUserLabel').textContent=`${permissionRole.id} · Matriz base del perfil`;$('permissionMode').value='PERSONALIZADO';renderPermissionMatrix();openOverlay('permissionModal');
}
function closePermissionModal(){$('permissionModal').classList.add('hidden');permissionUser=null;permissionRole=null;permissionDraft={}}
function setAllPermissions(enabled){if(!permissionUser||normalizeRole(permissionUser.rol_id)==='ROL-ADMIN')return;$('permissionMode').value='PERSONALIZADO';for(const m of PERMISSION_MODULES){permissionDraft[m.id]={};for(const a of m.actions)permissionDraft[m.id][a]=enabled}renderPermissionMatrix()}
async function saveUserPermissions(){if(!permissionUser)return;const btn=$('permissionSave');loading(btn,true);try{if(permissionRole){if(permissionRole.irreductible){closePermissionModal();return toast('ROL-ADMIN es irreductible')};await api('GUARDAR_PERMISOS_ROL',{rol_id:permissionRole.id,permisos:permissionDraft},true);closePermissionModal();toast('Matriz del perfil guardada y verificada');await loadProfileView();return}const mode=$('permissionMode').value;await api('GUARDAR_PERMISOS_USUARIO',{usuario_id:permissionUser.id,modo_permisos:mode,permisos:mode==='PERSONALIZADO'?permissionDraft:{}},true);closePermissionModal();toast('Permisos del usuario guardados y versionados');await loadUsers()}catch(e){toast('Permisos: '+e.message,true)}finally{loading(btn,false)}}
async function loadCheckin(){
 await ensureCatalogs();fillVehicleSelect();fillDriverSelect();
 const [j,scheduled]=await Promise.all([api('listar',{recurso:'CHECKINS',limit:80}),api('listar',{recurso:'CHECKIN_PROGRAMACIONES',limit:100})]);
 S.rows.CHECKINS=j.rows||[];S.rows.CHECKIN_PROGRAMACIONES=scheduled.rows||[];
 renderCheckinSchedules();
 const rows=j.rows||[];
 $('checkinRows').innerHTML=rows.length?rows.map(x=>{
   const result=String(x.resultado_tecnico||x.estado||'PENDIENTE').toUpperCase();
   const cls=result.includes('NO APTO')?'danger':result.includes('OBS')?'warn':'ok';
   const v=S.vehicles.find(v=>v.id===x.vehiculo_id)||{};
   const d=S.drivers.find(d=>d.id===x.conductor_id)||{};
   const obs=String(x.observacion_general||'Sin observaciones registradas.');
   const approved=String(x.estado||'').toUpperCase()==='APROBADO'||String(x.aprobacion_directa||'').toUpperCase()==='SI';
   return `<article class="checkin-card ${cls}">
     <div class="checkin-card-head">
       <div class="checkin-vehicle">
         <div class="checkin-car-icon">🚙</div>
         <div>
           <div class="checkin-plate">${esc(x.vehiculo_patente||v.patente||'Vehículo asociado')}</div>
           <div class="checkin-model">${esc([v.marca,v.modelo].filter(Boolean).join(' ')||'Ficha técnica')}</div>
         </div>
       </div>
       <span class="checkin-status-pill">${esc(result)}</span>
     </div>
     <div class="checkin-metrics">
       <div class="checkin-metric"><small>Conductor</small><strong>${esc(d.nombre||'Sin conductor')}</strong></div>
       <div class="checkin-metric"><small>Kilometraje</small><strong>${Number(x.kilometraje||0).toLocaleString('es-CL')} km</strong></div>
       <div class="checkin-metric"><small>Fecha</small><strong>${esc(x.fecha_inicio?new Date(x.fecha_inicio).toLocaleDateString('es-CL'):'—')}</strong></div>
     </div>
     <div class="checkin-tech-banner">
       <span>${approved?'✓ Aprobado operacionalmente':'Inspección técnica registrada'}</span>
       <span>Operar: ${esc(x.autorizado_operar||'NO')}</span>
     </div>
     <div class="checkin-observation">${esc(obs)}</div>
     <div class="checkin-card-actions">
       <button class="mini detail" data-checkin-detail="${esc(x.id)}">Ver inspección</button><button class="mini detail" data-checkin-pdf="${esc(x.id)}">PDF</button>
       ${permissionAllowed('FALLAS','REPORTAR')?`<button class="mini checkin-fault" data-checkin-create-failure="${esc(x.id)}">⚠ Informar falla</button>`:''}
       ${permissionAllowed('MANTENCIONES','CREAR')?`<button class="mini checkin-maintenance" data-checkin-create-maintenance="${esc(x.id)}">🔧 Programar mantención</button>`:''}
       ${permissionAllowed('CHECKIN','EDITAR')?`<button class="mini edit" data-edit-form="checkin" data-id="${esc(x.id)}">✎ Editar</button>`:''}
       ${permissionAllowed('CHECKIN','APROBAR_DIRECTO')&&!approved?`<button class="mini approve" data-approve-checkin="${esc(x.id)}">✓ Aprobar directo</button>`:''}
       ${permissionAllowed('CHECKIN','ELIMINAR')?`<button class="mini danger" data-delete-form="checkin" data-id="${esc(x.id)}">Eliminar</button>`:''}
     </div>
   </article>`;
 }).join(''):'<p class="muted">No hay Check-in todavía.</p>';updateCheckinActionHub();
}


function renderCheckinSchedules(){const rows=(S.rows.CHECKIN_PROGRAMACIONES||[]).filter(x=>!['COMPLETADO','CANCELADO','ANULADO'].includes(String(x.estado||'').toUpperCase()));const box=$('checkinScheduleRows');if(!box)return;box.innerHTML=rows.length?rows.map(x=>{const v=S.vehicles.find(v=>v.id===x.vehiculo_id)||{},d=S.drivers.find(d=>d.id===x.conductor_id)||{};return `<article class="schedule-card"><div><small>PROGRAMADO</small><strong>${esc(x.vehiculo_patente||v.patente||'Vehículo asociado')}</strong><span>${esc(x.conductor_nombre||d.nombre||'Sin conductor')}</span></div><div><strong>${esc(x.programado_para?new Date(x.programado_para).toLocaleString('es-CL'):'—')}</strong><span>${esc(x.observaciones||'Sin instrucciones')}</span></div><span class="badge ok">${esc(x.estado||'PROGRAMADO')}</span>${permissionAllowed('CHECKIN','ELIMINAR')?`<button class="mini danger" data-checkin-schedule-delete="${esc(x.id)}">Cancelar</button>`:''}</article>`}).join(''):'<div class="notification-empty">No hay Check-in programados.</div>'}
async function cancelCheckinSchedule(id){if(!confirm('¿Cancelar esta programación de Check-in?'))return;try{await api('eliminar',{recurso:'CHECKIN_PROGRAMACIONES',id});toast('Programación cancelada');await loadCheckin()}catch(e){toast('Programación: '+e.message,true)}}
async function openCheckinDetail(id){
 const row=(S.rows.CHECKINS||[]).find(x=>String(x.id)===String(id));
 if(!row)return toast('Check-in no encontrado',true);
 let items=[],evidences=[];
 try{
   const [r,ev]=await Promise.all([api('listar',{recurso:'CHECKIN_ITEMS',checkin_id:id,limit:100}),api('listar',{recurso:'CHECKIN_EVIDENCIAS',checkin_id:id,limit:100})]);
   items=r.rows||[];evidences=ev.rows||[];
 }catch(e){toast('No fue posible cargar todo el detalle: '+e.message,true)}
 const v=S.vehicles.find(v=>v.id===row.vehiculo_id)||{}, d=S.drivers.find(d=>d.id===row.conductor_id)||{};
 $('modalTitle').textContent='Inspección técnica · '+(v.patente||'Vehículo');
 $('modalBody').innerHTML=`
   <div class="checkin-detail-summary">
     <div><small>Resultado</small><strong>${esc(row.resultado_tecnico||row.estado||'—')}</strong></div>
     <div><small>Conductor</small><strong>${esc(d.nombre||'Sin conductor')}</strong></div>
     <div><small>Kilometraje</small><strong>${Number(row.kilometraje||0).toLocaleString('es-CL')} km</strong></div>
   </div>
   <div class="checkin-detail-items">
     ${items.length?items.map((it,i)=>{
       const st=String(it.estado||'PENDIENTE').toUpperCase(),cls=st==='FALLA'?'danger':st.includes('OBS')?'warn':'ok';
       return `<div class="checkin-detail-item ${cls}">
         <strong>${i+1}. ${esc(it.nombre||it.codigo)}</strong>
         <span class="state">${esc(st)}</span>
       </div>`;
     }).join(''):'<div class="notification-empty">Este Check-in todavía no tiene detalle de puntos registrado.</div>'}
   </div>
   ${row.observacion_general?`<label>Observación general</label><div class="checkin-observation">${esc(row.observacion_general)}</div>`:''}
   <div class="checkin-evidence-detail"><h4>Evidencias (${evidences.length})</h4>${evidences.length?evidences.map(ev=>`<button class="mini detail" type="button" data-checkin-evidence="${esc(ev.id)}">${ev.mime==='application/pdf'?'📄':'📷'} ${esc(ev.nombre_archivo||ev.tipo||'Evidencia')}</button>`).join(''):'<span class="muted">Sin evidencias adjuntas.</span>'}</div>
 `;
 $('modalCancel').textContent='Cerrar';$('modalSave').classList.add('hidden');openOverlay('modal');
}
function vehicleName(id){const v=S.vehicles.find(x=>x.id===id);return v?.patente||'Vehículo asociado'}
function offlineCheckinQueue(){try{return JSON.parse(localStorage.getItem('efm_checkin_offline_queue')||'[]')}catch{return[]}}
function setOfflineCheckinQueue(rows){localStorage.setItem('efm_checkin_offline_queue',JSON.stringify(rows.slice(-50)))}
function queueOfflineCheckin(payload){const q=offlineCheckinQueue();q.push({...payload,queuedAt:new Date().toISOString(),attempts:0});setOfflineCheckinQueue(q);return q.length}
async function persistCheckinPayload(payload){
 const {id,veh,driver,km,result,items,observation}=payload;
 const saved=await api('guardar',{recurso:'CHECKINS',row:{id,vehiculo_id:veh,conductor_id:driver,kilometraje:km,estado:'FINALIZADO',resultado_tecnico:result,autorizado_operar:result==='NO APTO'?'NO':'SI',observacion_general:observation,fecha_inicio:payload.fecha_inicio,fecha_termino:new Date().toISOString(),odometro_fuente:payload.odometro_fuente||'MANUAL',sincronizacion_estado:'SINCRONIZADO',advertencias:payload.advertencias||[]}});
 const failureRows=[];
 for(const item of items){
   try{await api('guardar',{recurso:'CHECKIN_ITEMS',row:{id:item.id||'CHI-'+crypto.randomUUID().toUpperCase(),checkin_id:id,codigo:item.codigo,nombre:item.nombre,categoria:'CHECKIN_TECNICO',estado:item.estado,criticidad:item.criticidad,observacion:item.observacion||null,detectado_por:'HUMANO'}})}catch(e){console.warn('[checkin][item no bloqueante]',item.codigo,e)}
   if(item.estado==='FALLA'&&permissionAllowed('FALLAS','REPORTAR')){
     try{const failure=await api('guardar',{recurso:'FALLAS',row:{id:'FAL-'+crypto.randomUUID().toUpperCase(),vehiculo_id:veh,conductor_id:driver,checkin_id:id,titulo:'Hallazgo Check-in: '+item.nombre,descripcion:'Generada automáticamente desde Check-in técnico. Puede completarse desde las acciones de esta inspección.',origen:'CHECKIN',severidad:item.criticidad,criticidad:item.criticidad,estado:'DETECTADA',kilometraje:km,puede_operar:(item.criticidad==='CRITICA'?'NO':'SI'),requiere_inmovilizacion:(item.criticidad==='CRITICA'?'SI':'NO')}});failureRows.push({codigo:item.codigo,row:failure.row})}catch(e){console.warn('[checkin][falla no bloqueante]',e)}
   }
 }
 return{saved,failureRows};
}
async function flushOfflineCheckins(){
 if(!S.token||!navigator.onLine)return;const q=offlineCheckinQueue();if(!q.length)return;const remain=[];
 for(const payload of q){try{await persistCheckinPayload(payload);console.info('[checkin][offline sincronizado]',payload.id)}catch(e){payload.attempts=Number(payload.attempts||0)+1;payload.lastError=String(e.message||e);remain.push(payload)}}
 setOfflineCheckinQueue(remain);if(q.length!==remain.length)toast(`${q.length-remain.length} Check-in pendiente(s) sincronizado(s)`);
}
async function saveCheckin(){
 const b=$('btnSaveCheckin');loading(b,true);
 try{
  if(S.lastCheckinSaved)throw new Error('CHECKIN_YA_GUARDADO_USA_NUEVA_INSPECCION');
  const veh=$('ciVehicle').value,driver=$('ciDriver').value||null,km=Number($('ciKm').value||0);if(!veh)throw new Error('VEHICULO_REQUERIDO');if(!km)throw new Error('KILOMETRAJE_REQUERIDO');
  if($('ciKmStatus')){$('ciKmStatus').textContent='KM confirmado ✓';$('ciKmStatus').classList.add('ok')}
  const id='CHK-'+crypto.randomUUID().toUpperCase(),result=calcResult(),items=checkinItemSnapshot(),observation=$('ciObs').value;
  const payload={id,veh,driver,km,result,items,observation,fecha_inicio:new Date().toISOString(),odometro_fuente:'MANUAL',advertencias:[]};
  let saved,failureRows=[],offline=false;
  try{const r=await persistCheckinPayload(payload);saved=r.saved;failureRows=r.failureRows}
  catch(e){
    if(e.isNetworkError||!navigator.onLine){
      const pending=queueOfflineCheckin(payload);offline=true;saved={row:{id,vehiculo_id:veh,conductor_id:driver,kilometraje:km,resultado_tecnico:result,observacion_general:observation,sincronizacion_estado:'PENDIENTE'}};
      toast(`Check-in guardado localmente · ${pending} pendiente(s) de sincronizar`);
    }else throw e;
  }
  let ev={uploaded:0,failed:[],total:0};
  if(!offline){ev=await uploadCheckinEvidenceFiles(id,veh);if(ev.failed.length){try{await api('REGISTRAR_ADVERTENCIA_CHECKIN',{id,advertencia:`${ev.failed.length} evidencia(s) pendiente(s) de carga`})}catch{}}}
  S.lastCheckinSaved=checkinSourceFromRow(saved.row||{id,vehiculo_id:veh,conductor_id:driver,kilometraje:km,resultado_tecnico:result,observacion_general:observation},{failedItems:items,failureRows});
  S.lastCheckinSaved.offline=offline;updateCheckinActionHub();
  if(offline)toast('✓ KM confirmado · Check-in completo · sincronización pendiente');
  else toast(`Check-in guardado${result==='NO APTO'?' · vehículo NO APTO':''}${ev.uploaded?` · ${ev.uploaded} evidencia(s)`:''}${ev.failed.length?` · ${ev.failed.length} evidencia(s) con advertencia`:''} · acciones habilitadas`);
  if(!offline)await loadCheckin();
 }catch(e){toast('No se pudo guardar: '+friendlyError(e.message),true)}finally{loading(b,false)}
}
async function loadCards(resource,target,renderer){const j=await api('listar',{recurso:resource,limit:200});S.rows[resource]=j.rows||[];if(resource==='FALLAS'){populateAdvancedFilter('fallas',S.rows[resource]);return renderFailures()}$(target).innerHTML=(j.rows||[]).length?(j.rows||[]).map(renderer).join(''):'<p class="muted">Sin registros.</p>'}
function renderFailures(){const rows=advancedFilteredRows('fallas',S.rows.FALLAS||[]);$('fallasRows').innerHTML=rows.length?rows.map(fallCard).join(''):'<div class="notification-empty">No hay fallas para los filtros seleccionados.</div>'}
const fallCard=x=>`<div class="card fault-card" data-fault-open="${esc(x.id)}"><h4>${esc(x.titulo)}</h4><p>${esc(x.vehiculo_patente||vehicleName(x.vehiculo_id))}${x.conductor_nombre?` · 👤 ${esc(x.conductor_nombre)}`:''}</p><button class="fault-comment-link" type="button" data-fault-open="${esc(x.id)}"><b>Comentario / detalle:</b> ${esc(x.descripcion||x.diagnostico_tecnico||'Pincha para ver la información completa')}</button><p>KM ${Number(x.kilometraje||0).toLocaleString('es-CL')} · ${esc(x.fecha_detectada?new Date(x.fecha_detectada).toLocaleString('es-CL'):'')}</p><span class="badge ${upperClass(x.criticidad)}">${esc(x.criticidad)}</span> <span class="badge">${esc(x.estado)}</span>${adminActions('falla',x.id)}</div>`;
const mantCard=x=>{const t=S.talleres.find(t=>String(t.id)===String(x.taller_id))||{};return `<div class="card"><h4>${esc(x.descripcion)}</h4><p>${esc(vehicleName(x.vehiculo_id))} · ${esc(x.tipo)}</p><p>Programada: ${esc(x.fecha_programada?new Date(x.fecha_programada).toLocaleDateString('es-CL'):'—')} · $${Number(x.costo_total||0).toLocaleString('es-CL')}</p>${x.taller_id?`<p>🏭 ${esc(x.taller_nombre||t.nombre||'Taller asociado')} · ${esc(x.taller_direccion||t.direccion||'Dirección no informada')}</p>`:''}<span class="badge">${esc(x.estado)}</span>${adminActions('mantencion',x.id)}<div class="life-actions"><button class="mini detail" data-life-vehicle="${esc(x.vehiculo_id)}">Ver vehículo</button>${permissionAllowed('MANTENCIONES','EDITAR')?`<button class="mini edit" data-order-from-maintenance="${esc(x.id)}">📋 Crear orden de servicio</button>`:''}</div></div>`};
const fuelCard=x=>`<article class="card fuel-card ${String(x.consumo_anomalo||'NO').toUpperCase()==='SI'?'anomaly':''}"><h4>${esc(x.vehiculo_patente||vehicleName(x.vehiculo_id))}</h4><p>${x.conductor_nombre?`👤 ${esc(x.conductor_nombre)} · `:''}${esc(x.estacion||'Estación no informada')}</p><div class="fuel-metrics"><span><small>LITROS</small><strong>${Number(x.litros||0).toLocaleString('es-CL')}</strong></span><span><small>MONTO</small><strong>$${Number(x.monto_total||0).toLocaleString('es-CL')}</strong></span><span><small>$/L</small><strong>$${Number(x.precio_litro||0).toLocaleString('es-CL')}</strong></span><span><small>KM</small><strong>${Number(x.kilometraje||0).toLocaleString('es-CL')}</strong></span><span><small>KM/L</small><strong>${Number(x.rendimiento_km_l||0).toFixed(2)}</strong></span><span><small>COSTO/KM</small><strong>$${Number(x.costo_km||0).toFixed(0)}</strong></span></div>${x.direccion?`<p>📍 ${esc(x.direccion)}</p>`:''}<span class="badge">${esc(new Date(x.fecha_hora).toLocaleString('es-CL'))}</span>${String(x.consumo_anomalo||'NO').toUpperCase()==='SI'?'<span class="badge danger">Consumo anómalo</span>':''}${adminActions('combustible',x.id)}</article>`;
function upperClass(v){v=String(v||'').toUpperCase();return /CRIT|URG|ALTA/.test(v)?'danger':/MED|OBS|ALERTA/.test(v)?'warn':'ok'}
async function loadFuelModule(){await ensureCatalogs();const j=await api('listar',{recurso:'COMBUSTIBLE',limit:500});S.rows.COMBUSTIBLE=j.rows||[];populateAdvancedFilter('combustible',S.rows.COMBUSTIBLE);renderFuelModule()}
function renderFuelModule(){const rows=advancedFilteredRows('combustible',S.rows.COMBUSTIBLE||[]),liters=rows.reduce((a,x)=>a+Number(x.litros||0),0),spend=rows.reduce((a,x)=>a+Number(x.monto_total||0),0),avgPrice=liters?spend/liters:0,efficiencies=rows.map(x=>Number(x.rendimiento_km_l||0)).filter(x=>x>0),avgEff=efficiencies.length?efficiencies.reduce((a,x)=>a+x,0)/efficiencies.length:0,anomalies=rows.filter(x=>String(x.consumo_anomalo||'NO').toUpperCase()==='SI').length;$('fuelKpis').innerHTML=ringKpi('Gasto','$'+Math.round(spend).toLocaleString('es-CL'),Math.min(100,spend/1000000*100),'blue',`${rows.length} cargas`)+ringKpi('Litros',liters.toFixed(1)+' L',Math.min(100,liters/20),'amber','Consumo registrado')+ringKpi('Precio promedio','$'+Math.round(avgPrice).toLocaleString('es-CL'),Math.min(100,avgPrice/25),'green','Por litro')+ringKpi('Rendimiento',avgEff.toFixed(2)+' km/L',Math.min(100,avgEff*7),'green','Promedio calculado')+ringKpi('Anomalías',anomalies,Math.min(100,anomalies*20),anomalies?'red':'green','Requieren revisión');$('combustibleRows').innerHTML=rows.length?rows.map(fuelCard).join(''):'<div class="notification-empty">No hay cargas para los filtros seleccionados.</div>';const alert=$('fuelAlert');if(alert){alert.classList.toggle('hidden',!anomalies);alert.textContent=anomalies?`⚠ ${anomalies} carga(s) muestran desviación de consumo/costo y deben revisarse.`:''}}
function getBrowserPosition(){return new Promise((resolve,reject)=>{if(!navigator.geolocation)return reject(new Error('GPS_NO_DISPONIBLE'));navigator.geolocation.getCurrentPosition(p=>resolve({latitud:p.coords.latitude,longitud:p.coords.longitude,precision:p.coords.accuracy}),reject,{enableHighAccuracy:true,timeout:12000,maximumAge:15000})})}
async function captureFuelGps(show=true){
 try{S.fuelPosition=await getBrowserPosition();const r=await api('GEOCODIFICAR_COORDENADAS',S.fuelPosition,true);S.fuelPosition={...S.fuelPosition,direccion:r.ubicacion?.direccion||''};if(show)toast('Ubicación de combustible obtenida');return S.fuelPosition}catch(e){if(show)toast('Ubicación combustible: '+(e.message||e),true);return null}
}
async function loadNearbyFuelStations(){
 const b=$('btnFuelNearby');loading(b,true);try{const pos=S.fuelPosition||await captureFuelGps(false);if(!pos)throw new Error('UBICACION_REQUERIDA');const j=await api('ESTACIONES_COMBUSTIBLE_CERCANAS',{latitud:pos.latitud,longitud:pos.longitud,radio_m:8000},true);S.fuelNearby=j.rows||[];$('fuelNearbyRows').innerHTML=S.fuelNearby.length?S.fuelNearby.map(x=>`<article class="fuel-station"><h4>${esc(x.nombre||'Estación de servicio')}</h4><p>📍 ${esc(x.direccion||'Dirección no disponible')}</p><p>${Number(x.distancia_km||0).toFixed(2)} km${x.precio_litro?` · $${Number(x.precio_litro).toLocaleString('es-CL')}/L`:''}</p><div class="card-actions"><button class="mini detail" data-fuel-nav="${esc(x.latitud)},${esc(x.longitud)}">Ir / Navegar</button></div></article>`).join(''):'<div class="notification-empty">No se encontraron estaciones dentro del radio consultado.</div>';toast(`${S.fuelNearby.length} estación(es) cercana(s)`)}catch(e){toast('Estaciones: '+e.message,true)}finally{loading(b,false)}
}



function serviceOrderNumber(x){return x.correlativo?`OS-${String(x.correlativo).padStart(6,'0')}`:`OS-${String(x.id||'').replace(/^ORDE-/,'').slice(-8)}`}
function orderTotal(x){return Number(x.costo_repuestos||0)+Number(x.costo_mano_obra||0)+Number(x.costo_otros||0)}
function serviceOrderCard(x){const t=S.talleres.find(t=>String(t.id)===String(x.taller_id))||{},total=orderTotal(x),number=serviceOrderNumber(x);return `<article class="service-order-card"><div class="service-order-head"><div><span class="service-order-number">${esc(number)}</span><h4>${esc(x.titulo||'Orden de servicio')}</h4><p>${esc(vehicleName(x.vehiculo_id))}${t.nombre?` · ${esc(t.nombre)}`:''}</p></div><span class="badge ${upperClass(x.estado)}">${esc(x.estado||'ABIERTA')}</span></div><div class="service-order-metrics"><span><small>PRIORIDAD</small><strong>${esc(x.prioridad||'NORMAL')}</strong></span><span><small>PROGRAMADA</small><strong>${esc(x.fecha_programada?new Date(x.fecha_programada).toLocaleDateString('es-CL'):'—')}</strong></span><span><small>COSTO</small><strong>$${Math.round(total).toLocaleString('es-CL')}</strong></span></div><p class="service-order-description">${esc(x.descripcion||'Sin descripción')}</p><div class="card-actions"><button class="mini detail" data-order-pdf="${esc(x.id)}">📄 PDF moderno</button>${permissionAllowed('MANTENCIONES','EDITAR')?`<button class="mini edit" data-edit-form="orden" data-id="${esc(x.id)}">✎ Editar</button>`:''}${permissionAllowed('MANTENCIONES','ELIMINAR')?`<button class="mini danger" data-delete-form="orden" data-id="${esc(x.id)}">Eliminar</button>`:''}</div></article>`}
async function loadServiceOrders(){await ensureCatalogs();if(!S.talleres.length){try{const tw=await api('listar',{recurso:'TALLERES',limit:300});S.talleres=tw.rows||[]}catch{}}const j=await api('listar',{recurso:'ORDENES_TRABAJO',limit:500});S.orders=j.rows||[];S.rows.ORDENES_TRABAJO=S.orders;populateAdvancedFilter('ordenes',S.orders);renderServiceOrders()}
function renderServiceOrders(){const rows=advancedFilteredRows('ordenes',S.orders||[]),open=rows.filter(x=>!['FINALIZADA','CERRADA','ANULADA'].includes(String(x.estado||'').toUpperCase())).length,urgent=rows.filter(x=>['URGENTE','ALTA','CRITICA'].includes(String(x.prioridad||x.criticidad||'').toUpperCase())).length,total=rows.reduce((a,x)=>a+orderTotal(x),0);$('orderKpis').innerHTML=ringKpi('Órdenes',rows.length,Math.min(100,rows.length*8),'blue','Filtradas')+ringKpi('Abiertas',open,rows.length?open/rows.length*100:0,open?'amber':'green','Requieren gestión')+ringKpi('Alta / urgente',urgent,rows.length?urgent/rows.length*100:0,urgent?'red':'green','Prioridad técnica')+ringKpi('Costo acumulado','$'+Math.round(total).toLocaleString('es-CL'),Math.min(100,total/1000000*100),'blue','Servicios filtrados');$('orderRows').innerHTML=rows.length?rows.map(serviceOrderCard).join(''):'<div class="notification-empty">No hay órdenes para los filtros seleccionados.</div>'}
async function openOrderFromMaintenance(id){const m=(S.rows.MANTENCIONES||[]).find(x=>String(x.id)===String(id));await openForm('orden');if(!m)return;setModalField('vehiculo_id',m.vehiculo_id);setModalField('mantencion_id',m.id);setModalField('taller_id',m.taller_id||'');setModalField('titulo',`Servicio · ${m.descripcion||vehicleName(m.vehiculo_id)}`);setModalField('descripcion',m.observaciones||m.descripcion||'');setModalField('kilometraje_apertura',m.kilometraje_real||m.kilometraje_programado||'')}
function downloadServiceOrderPdf(id){const x=S.orders.find(o=>String(o.id)===String(id));if(!x)return;const t=S.talleres.find(t=>String(t.id)===String(x.taller_id))||{},v=S.vehicles.find(v=>String(v.id)===String(x.vehiculo_id))||{};const rows=[{'Folio':serviceOrderNumber(x),'Vehículo':x.vehiculo_patente||v.patente||'Vehículo asociado','Marca / modelo':[v.marca,v.modelo].filter(Boolean).join(' '),'Taller':t.nombre||'Sin taller','Dirección taller':t.direccion||'','Prioridad':x.prioridad||'NORMAL','Estado':x.estado||'ABIERTA','Fecha programada':formatReportValue(x.fecha_programada),'KM apertura':x.kilometraje_apertura||0,'Diagnóstico':x.diagnostico||'','Trabajo realizado':x.trabajo_realizado||'','Repuestos':Number(x.costo_repuestos||0),'Mano de obra':Number(x.costo_mano_obra||0),'Otros':Number(x.costo_otros||0),'Costo total':orderTotal(x)}];EFleetExport.toPdf(`E-Fleet_${serviceOrderNumber(x)}.pdf`,`ORDEN DE SERVICIO · ${serviceOrderNumber(x)}`,rows,`${S.company?.nombre||''} · ${S.company?.rut||''}`)}

async function loadMaintenance(){if(!S.vehicles.length)await loadVehicles();if(!S.talleres.length){try{const tw=await api('listar',{recurso:'TALLERES',limit:300});S.talleres=tw.rows||[];S.rows.TALLERES=S.talleres}catch{}}const j=await api('listar',{recurso:'MANTENCIONES',limit:500});S.rows.MANTENCIONES=j.rows||[];populateAdvancedFilter('mantenciones',S.rows.MANTENCIONES);renderMaintenance()}
function renderMaintenance(){const rows=advancedFilteredRows('mantenciones',S.rows.MANTENCIONES||[]),closed=rows.filter(x=>['COMPLETADA','CERRADA'].includes(String(x.estado||'').toUpperCase())).length,overdue=rows.filter(x=>String(x.estado||'').toUpperCase()==='VENCIDA').length,totalCost=rows.reduce((a,x)=>a+Number(x.costo_total||0),0);$('maintenanceKpis').innerHTML=ringKpi('Cumplimiento',`${rows.length?Math.round(closed/rows.length*100):0}%`,rows.length?closed/rows.length*100:0,'green',`${closed} completadas`)+ringKpi('Pendientes',String(rows.length-closed),rows.length?(rows.length-closed)/rows.length*100:0,overdue?'red':'amber',`${overdue} vencidas`)+ringKpi('Costo acumulado','$'+Math.round(totalCost).toLocaleString('es-CL'),Math.min(100,totalCost/1000000*100),'blue','Registros filtrados');$('mantencionesRows').innerHTML=rows.length?rows.map(mantCard).join(''):'<div class="notification-empty">No hay mantenciones para los filtros seleccionados.</div>'}

async function loadMaintenanceHistory(){
 if(!S.vehicles.length)await loadVehicles();let j;
 try{j=await api('listar',{recurso:'HISTORIAL_MANTENCIONES',limit:500})}
 catch(e){if(['RECURSO_NO_DISPONIBLE','ACCION_NO_DISPONIBLE'].includes(String(e.message||'').toUpperCase()))j=await api('listar',{recurso:'MANTENCIONES',limit:500});else throw e}
 S.history=j.rows||[];
 const select=$('historyVehicle'),current=select?.value||'';if(select){select.innerHTML='<option value="">Todos los vehículos</option>'+S.vehicles.map(v=>`<option value="${esc(v.id)}">${esc(v.patente)} · ${esc(v.marca||'')} ${esc(v.modelo||'')}</option>`).join('');select.value=current}populateAdvancedFilter('historial',S.history);
 renderMaintenanceHistory();
}
function renderMaintenanceHistory(){
 const rows=advancedFilteredRows('historial',S.history||[]);
 const completed=rows.filter(x=>['COMPLETADA','CERRADA'].includes(String(x.estado||'').toUpperCase())).length,cost=rows.reduce((a,x)=>a+Number(x.costo_total||0),0),preventive=rows.filter(x=>String(x.tipo||'').toUpperCase()==='PREVENTIVA').length;
 $('historyKpis').innerHTML=ringKpi('Registros',String(rows.length),Math.min(100,rows.length*5),'blue','Trazabilidad visible')+ringKpi('Completadas',String(completed),rows.length?completed/rows.length*100:0,'green',`${rows.length?Math.round(completed/rows.length*100):0}% del historial`)+ringKpi('Preventivas',String(preventive),rows.length?preventive/rows.length*100:0,'amber','Control planificado')+ringKpi('Costo total','$'+Math.round(cost).toLocaleString('es-CL'),Math.min(100,cost/1000000*100),'blue','Mantenciones filtradas');
 $('historyRows').innerHTML=rows.length?rows.map(x=>{const date=x.fecha_termino||x.fecha_inicio||x.fecha_programada||x.actualizado_en;return `<article class="timeline-item"><div class="timeline-dot ${upperClass(x.estado)}"></div><div class="timeline-date">${esc(date?new Date(date).toLocaleDateString('es-CL'):'Sin fecha')}</div><div class="timeline-card"><div class="timeline-head"><div><span class="badge">${esc(x.tipo||'MANTENCIÓN')}</span><h4>${esc(x.descripcion||'Mantención')}</h4></div><span class="badge ${upperClass(x.estado)}">${esc(x.estado||'PENDIENTE')}</span></div><p>🚙 ${esc(vehicleName(x.vehiculo_id))} · KM real ${Number(x.kilometraje_real||0).toLocaleString('es-CL')} · $${Number(x.costo_total||0).toLocaleString('es-CL')}</p>${x.observaciones?`<p>${esc(x.observaciones)}</p>`:''}<button class="mini detail" data-life-vehicle="${esc(x.vehiculo_id)}">Abrir hoja de vida</button></div></article>`}).join(''):'<div class="notification-empty">No hay mantenciones para estos filtros.</div>';
}

function predictionCard(x){const risk=Number(x.riesgo_porcentaje||x.probabilidad_porcentaje||0),tone=risk>=75?'danger':risk>=50?'warn':'ok';return `<article class="card prediction-card"><div class="prediction-card-head"><div><span class="badge ${tone}">${esc(x.nivel_riesgo||'BAJO')}</span><h4>${esc(vehicleName(x.vehiculo_id)||'Vehículo')}</h4></div><strong>${Math.round(risk)}%</strong></div><p>${esc(x.explicacion||x.tipo_prediccion||'Análisis registrado')}</p><p><b>Acción sugerida:</b> ${esc(x.recomendacion||'Mantener control preventivo')}</p><div class="metric-bar"><span style="width:${Math.max(0,Math.min(100,risk))}%"></span></div><div class="life-actions"><button class="mini detail" data-life-vehicle="${esc(x.vehiculo_id)}">Ver vehículo</button></div></article>`}
async function loadPredictions(){if(!S.vehicles.length&&permissionAllowed('VEHICULOS','LEER'))await loadVehicles();const j=await api('listar',{recurso:'PREDICCIONES',limit:200});S.rows.PREDICCIONES=j.rows||[];populateAdvancedFilter('predicciones',S.rows.PREDICCIONES);renderPredictions()}
function renderPredictions(){const rows=advancedFilteredRows('predicciones',S.rows.PREDICCIONES||[]);$('predictionRows').innerHTML=rows.length?rows.map(predictionCard).join(''):'<div class="notification-empty">No hay análisis para los filtros seleccionados.</div>'}
function renderPredictionOverview(a){
 if(!a)return;const risk=String(a.nivelRiesgo||'BAJO').toUpperCase(),health=Number(a.saludPorcentaje||0),k=a.kpis||{},priorities=a.prioridades||[];
 $('predictionOverview').innerHTML=`<div class="prediction-ring-card">${ringKpi('Salud estimada',`${Math.round(health)}%`,health,health<50?'red':health<75?'amber':'green',`Riesgo ${risk}`)}</div><div class="prediction-summary"><span class="risk-banner ${risk.toLowerCase()}">RIESGO ${esc(risk)}</span><h3>${esc(a.resumenEjecutivo||'Análisis completado')}</h3><div class="prediction-mini-grid"><div><small>Fallas abiertas</small><strong>${Number(k.fallasAbiertas||0)}</strong></div><div><small>Críticas</small><strong>${Number(k.fallasCriticas||0)}</strong></div><div><small>Mantenciones</small><strong>${Number(k.mantencionesPendientes||0)}</strong></div><div><small>Documentos vencidos</small><strong>${Number(k.documentosVencidos||0)}</strong></div></div></div><div class="priority-list"><h4>Prioridades</h4>${priorities.length?priorities.map((p,i)=>`<div class="priority-item"><b>${i+1}</b><span><strong>${esc(p.titulo)}</strong><small>${esc(p.evidencia)}</small><em>${esc(p.accion)}</em></span></div>`).join(''):'<p class="muted">Sin prioridades críticas registradas.</p>'}</div>`;
}
async function runPredictiveAnalysis(){const btn=$('btnRunPrediction');loading(btn,true);try{const j=await api('NEXO',{pregunta:'Genera el análisis predictivo integral de la flota, prioriza riesgos de mantenimiento y explica la acción humana recomendada.'},true);S.lastPrediction=j.analisis||null;renderPredictionOverview(S.lastPrediction);toast('Análisis predictivo actualizado y guardado');await loadPredictions();await loadNotifications(false)}catch(e){toast('Análisis predictivo: '+e.message,true)}finally{loading(btn,false)}}

function lifeList(title,rows,render){return `<section class="life-section"><div class="life-section-head"><h4>${esc(title)}</h4><span>${rows.length}</span></div>${rows.length?rows.slice(0,12).map(render).join(''):'<p class="muted">Sin registros.</p>'}</section>`}
async function openVehicleLife(id){
 try{
  const j=await api('HOJA_VIDA_VEHICULO',{id},true),v=j.vehiculo,k=j.kpis||{};$('modalTitle').textContent=`Hoja de vida · ${v.patente||'Vehículo'}`;$('modal').querySelector('.modal-card').classList.add('wide-modal');
  $('modalBody').innerHTML=`<div class="life-identity"><span class="life-icon">🚙</span><div><span class="profile-label">VEHÍCULO</span><h3>${esc(v.patente)}</h3><p>${esc(v.marca||'')} ${esc(v.modelo||'')} · ${Number(v.kilometraje||0).toLocaleString('es-CL')} km · ${esc(v.estado||'')}</p></div></div><div class="ring-kpi-grid compact">${ringKpi('Mantenciones',k.mantenciones||0,Math.min(100,(k.mantenciones||0)*8),'blue','$'+Number(k.costoMantenciones||0).toLocaleString('es-CL'))}${ringKpi('Fallas abiertas',k.fallasAbiertas||0,Math.min(100,(k.fallasAbiertas||0)*20),k.fallasAbiertas?'red':'green','Riesgo vigente')}${ringKpi('Check-in',k.checkins||0,Math.min(100,(k.checkins||0)*5),'green','Inspecciones')}${ringKpi('Combustible',Math.round(k.combustibleLitros||0)+' L',Math.min(100,(k.combustibleLitros||0)/20),'amber','Acumulado')}</div><div class="life-columns">${lifeList('Mantenciones',j.mantenciones||[],x=>`<div class="life-row"><span>🔧</span><div><strong>${esc(x.descripcion)}</strong><small>${esc(x.estado)} · $${Number(x.costo_total||0).toLocaleString('es-CL')}</small></div></div>`)}${lifeList('Fallas',j.fallas||[],x=>`<div class="life-row clickable" data-fault-open="${esc(x.id)}"><span>⚠</span><div><strong>${esc(x.titulo||'Falla')}</strong><small>${esc(x.criticidad||x.severidad)} · ${esc(x.estado)} · Pincha para ver detalle</small></div></div>`)}${lifeList('Documentos',j.documentos||[],x=>`<div class="life-row"><span>📄</span><div><strong>${esc(x.tipo_documento||'Documento')}</strong><small>${esc(x.fecha_vencimiento||'Sin vencimiento')}</small></div></div>`)}${lifeList('Check-in',j.checkins||[],x=>`<div class="life-row"><span>✓</span><div><strong>${esc(x.resultado_tecnico||x.estado)}</strong><small>${esc(x.fecha_inicio?new Date(x.fecha_inicio).toLocaleString('es-CL'):'')}</small></div></div>`)}</div>`;
  $('modalSave').classList.add('hidden');$('modalCancel').textContent='Cerrar';openOverlay('modal');
 }catch(e){toast('Hoja de vida: '+e.message,true)}
}
async function openDriverLife(id){
 try{
  const j=await api('HOJA_VIDA_CONDUCTOR',{id},true),c=j.conductor,k=j.kpis||{};$('modalTitle').textContent=`Hoja de vida · ${c.nombre||'Conductor'}`;$('modal').querySelector('.modal-card').classList.add('wide-modal');
  $('modalBody').innerHTML=`<div class="life-identity"><span class="life-icon">👤</span><div><span class="profile-label">CONDUCTOR</span><h3>${esc(c.nombre)}</h3><p>${esc(c.rut||'Sin RUT')} · Licencia ${esc(c.licencia_clase||'—')} · ${c.usuario_id?'Usuario asociado':'Sin usuario asociado'}</p></div></div><div class="ring-kpi-grid compact">${ringKpi('Asignaciones',k.asignaciones||0,Math.min(100,(k.asignaciones||0)*12),'blue','Vehículos')}${ringKpi('Check-in',k.checkins||0,Math.min(100,(k.checkins||0)*6),'green','Inspecciones')}${ringKpi('Fallas',k.fallas||0,Math.min(100,(k.fallas||0)*15),k.fallas?'red':'green','Reportadas')}${ringKpi('Combustible',k.cargasCombustible||0,Math.min(100,(k.cargasCombustible||0)*8),'amber','Cargas')}</div><div class="life-columns">${lifeList('Asignaciones',j.asignaciones||[],x=>`<div class="life-row"><span>🚙</span><div><strong>${esc(vehicleName(x.vehiculo_id))}</strong><small>${esc(x.estado)} · ${esc(x.fecha_asignacion?new Date(x.fecha_asignacion).toLocaleDateString('es-CL'):'')}</small></div></div>`)}${lifeList('Check-in',j.checkins||[],x=>`<div class="life-row"><span>✓</span><div><strong>${esc(vehicleName(x.vehiculo_id))}</strong><small>${esc(x.resultado_tecnico||x.estado)}</small></div></div>`)}${lifeList('Fallas reportadas',j.fallas||[],x=>`<div class="life-row clickable" data-fault-open="${esc(x.id)}"><span>⚠</span><div><strong>${esc(x.titulo||'Falla')}</strong><small>${esc(x.criticidad||x.severidad)} · ${esc(x.estado)} · Pincha para ver detalle</small></div></div>`)}${lifeList('Documentación y antecedentes',j.documentos||[],x=>{const st=docComputedState(x);return `<div class="life-row"><span>📄</span><div><strong>${esc(x.tipo_documento||'Documento')}</strong><small>${esc(st.replace('_',' '))} · ${esc(x.fecha_vencimiento||'Sin vencimiento')}</small></div></div>`})}</div><div class="driver-doc-actions"><button class="mini detail" data-driver-docs="${esc(c.id)}">📄 Administrar documentación desde Conductores</button></div>`;
  $('modalSave').classList.add('hidden');$('modalCancel').textContent='Cerrar';openOverlay('modal');
 }catch(e){toast('Hoja de vida: '+e.message,true)}
}
async function openMaintenanceForVehicle(id){await openForm('mantencion');const select=$('modalBody').querySelector('[data-field="vehiculo_id"]');if(select)select.value=id}

const FORMS={
 vehiculo:{title:'Vehículo',resource:'VEHICULOS',fields:[
   ['patente','Patente','text'],['marca','Marca','text'],['modelo','Modelo','text'],['anio','Año','number'],
   ['color','Color','text'],['vin','VIN / Chasis','text'],['combustible','Combustible','text'],
   ['kilometraje','Kilometraje actual','number'],['estado','Estado','select:ACTIVO,DETENIDO,EN MANTENCION,INMOVILIZADO'],
   ['proxima_mantencion_fecha','Próxima mantención fecha','date'],['proxima_mantencion_km','Próxima mantención KM','number']
 ]},
 conductor:{title:'Conductor',resource:'CONDUCTORES',fields:[
   ['nombre','Nombre','text'],['rut','RUT','text'],['correo','Correo','email'],['telefono','Teléfono','text'],
   ['licencia_clase','Licencia clase','text'],['licencia_vencimiento','Vencimiento licencia','date'],
   ['usuario_id','Usuario de acceso asociado','user'],['estado','Estado','select:Activo,Inactivo,Suspendido']
 ]},
 checkin:{title:'Check-in técnico',resource:'CHECKINS',needsVehicle:true,needsDriver:true,fields:[
   ['kilometraje','Kilometraje','number'],
   ['resultado_tecnico','Resultado técnico','select:APTO,APTO CON OBSERVACIÓN,NO APTO'],
   ['autorizado_operar','Autorizado a operar','select:SI,NO'],
   ['estado','Estado','select:PENDIENTE,FINALIZADO,APROBADO,ANULADO'],
   ['observacion_general','Observación general','textarea']
 ]},
 falla:{title:'Falla',resource:'FALLAS',needsVehicle:true,needsDriver:true,fields:[
   ['titulo','Título / síntoma','text'],['descripcion','Descripción técnica','textarea'],
   ['origen','Origen','select:MANUAL,CHECKIN,MANTENCION,CONDUCTOR,NEXO'],
   ['severidad','Severidad','select:BAJA,MEDIA,ALTA,CRITICA'],['criticidad','Criticidad','select:BAJA,MEDIA,ALTA,CRITICA'],
   ['estado','Estado','select:DETECTADA,INFORMADA,REVISION,PROGRAMADA,EN REPARACION,RESUELTA,VERIFICADA'],
   ['kilometraje','Kilometraje','number'],['puede_operar','Puede operar','select:SI,NO'],
   ['requiere_inmovilizacion','Requiere inmovilización','select:NO,SI'],
   ['diagnostico_tecnico','Diagnóstico técnico','textarea'],['recomendacion','Recomendación','textarea']
 ]},
 mantencion:{title:'Mantención',resource:'MANTENCIONES',needsVehicle:true,fields:[
   ['descripcion','Descripción / trabajo','textarea'],['tipo','Tipo','select:PREVENTIVA,CORRECTIVA,PREDICTIVA'],['taller_id','Taller / lugar de atención','workshop'],
   ['estado','Estado','select:PENDIENTE,PROGRAMADA,EN PROCESO,COMPLETADA,VENCIDA,ANULADA'],
   ['kilometraje_programado','KM programado','number'],['kilometraje_real','KM real','number'],
   ['fecha_programada','Fecha programada','date'],['fecha_inicio','Fecha inicio','date'],['fecha_termino','Fecha término','date'],
   ['costo_total','Costo total','number'],['observaciones','Observaciones','textarea']
 ]},
 combustible:{title:'Carga de combustible',resource:'COMBUSTIBLE',needsVehicle:true,needsDriver:true,fields:[
   ['kilometraje','Kilometraje','number'],['litros','Litros','number'],['precio_litro','Precio/litro','number'],
   ['monto_total','Monto total','number'],['tipo_combustible','Tipo combustible','text'],['estacion','Estación','text'],
   ['direccion','Dirección','text'],['observaciones','Observaciones','textarea']
 ]},
 taller:{title:'Taller',resource:'TALLERES',fields:[
   ['nombre','Nombre / Empresa','text'],['rut','RUT','text'],['direccion','Dirección completa','text'],['telefono','Teléfono','text'],
   ['correo','Correo','email'],['contacto','Contacto','text'],['especialidad','Especialidad','text'],['estado','Estado','select:ACTIVO,INACTIVO']
 ]},
 orden:{title:'Orden de servicio',resource:'ORDENES_TRABAJO',needsVehicle:true,fields:[
   ['titulo','Título / servicio requerido','text'],['mantencion_id','Mantención asociada','maintenance'],['falla_id','Falla asociada','failure'],['taller_id','Taller','workshop'],
   ['prioridad','Prioridad','select:NORMAL,ALTA,URGENTE'],['estado','Estado','select:ABIERTA,PROGRAMADA,EN PROCESO,FINALIZADA,CERRADA,ANULADA'],
   ['fecha_programada','Fecha programada','date'],['kilometraje_apertura','KM apertura','number'],
   ['descripcion','Descripción / alcance','textarea'],['diagnostico','Diagnóstico','textarea'],['trabajo_realizado','Trabajo realizado','textarea'],
   ['costo_repuestos','Costo repuestos','number'],['costo_mano_obra','Costo mano de obra','number'],['costo_otros','Otros costos','number']
 ]},
 usuario:{title:'Usuario',resource:'USUARIOS',fields:[
   ['nombre','Nombre completo','text'],['correo','Correo de acceso','email'],['telefono','Teléfono','text'],
   ['rol_id','Perfil','role'],
   ['conductor_asociado_id','Conductor asociado (solo Conductor o Supervisor geográfico)','driverassociation'],
   ['estado','Estado','select:Activo,Inactivo,Suspendido'],
   ['contrasena','Contraseña (mínimo 8 caracteres; al editar es opcional)','password']
 ]}
};
let activeForm=null,activeRecord=null,activeCheckinContext=null;
const RESOURCE_BY_FORM={vehiculo:'VEHICULOS',conductor:'CONDUCTORES',checkin:'CHECKINS',falla:'FALLAS',mantencion:'MANTENCIONES',orden:'MANTENCIONES',taller:'TALLERES',combustible:'COMBUSTIBLE',asignacion:'ASIGNACIONES',taller:'TALLERES',usuario:'USUARIOS'};

function recordByForm(formKey,id){
 const resource=RESOURCE_BY_FORM[formKey], rows=resource==='VEHICULOS'?S.vehicles:resource==='CONDUCTORES'?S.drivers:(S.rows[resource]||[]);
 return rows.find(x=>String(x.id)===String(id))||null;
}
function dateForInput(v){if(!v)return '';const d=new Date(v);return Number.isNaN(d.getTime())?'':d.toISOString().slice(0,10)}
async function openForm(k,record=null){
 activeForm=FORMS[k];activeRecord=record;activeCheckinContext=null;if(!activeForm)return;await ensureCatalogs();
 if(k==='conductor'&&isManagement()&&!S.users.length){const users=await api('listar',{recurso:'USUARIOS',limit:300});S.users=users.rows||[];S.rows.USUARIOS=S.users}
 if(['mantencion','orden'].includes(k)&&!S.talleres.length){try{const tw=await api('listar',{recurso:'TALLERES',limit:300});S.talleres=tw.rows||[];S.rows.TALLERES=S.talleres}catch{}}
 if(k==='orden'){if(!S.rows.MANTENCIONES?.length){try{const mm=await api('listar',{recurso:'MANTENCIONES',limit:300});S.rows.MANTENCIONES=mm.rows||[]}catch{}}if(!S.rows.FALLAS?.length){try{const ff=await api('listar',{recurso:'FALLAS',limit:300});S.rows.FALLAS=ff.rows||[]}catch{}}}
 $('modalTitle').textContent=(record?'Editar ':'Nuevo ')+activeForm.title;
 let h='';
 if(record)h+=`<div class="edit-id form-span-full">ID: ${esc(record.id)}</div>`;
 if(activeForm.needsVehicle)h+=`<div class="form-field"><label>Vehículo</label><select data-field="vehiculo_id"><option value="">Seleccione</option>${S.vehicles.map(v=>`<option value="${esc(v.id)}">${esc(v.patente)} · ${esc(v.marca||'')} ${esc(v.modelo||'')}</option>`).join('')}</select></div>`;
 if(activeForm.needsDriver)h+=`<div class="form-field"><label>Conductor</label><select data-field="conductor_id"><option value="">Sin conductor</option>${S.drivers.map(v=>`<option value="${esc(v.id)}">${esc(v.nombre)}</option>`).join('')}</select></div>`;
 for(const [key,label,type] of activeForm.fields){
   h+=`<div class="form-field ${type==='textarea'?'form-span-full':''}"><label>${esc(label)}</label>`;
   if(type==='textarea')h+=`<textarea data-field="${key}" rows="3"></textarea>`;
   else if(type.startsWith('select:'))h+=`<select data-field="${key}">${type.slice(7).split(',').map(v=>`<option value="${esc(v)}">${esc(v)}</option>`).join('')}</select>`;
   else if(type==='role')h+=`<select data-field="${key}"><option value="ROL-CONDUCTOR">Conductor</option><option value="ROL-OPERADOR">Operador</option><option value="ROL-SUPERVISOR-GEO">Supervisor geográfico</option><option value="ROL-SUPERVISOR">Supervisor</option><option value="ROL-GERENCIA">Gerencia</option><option value="ROL-ADMIN">Administrador</option></select>`;
   else if(type==='workshop')h+=`<select data-field="${key}"><option value="">Sin taller asignado</option>${S.talleres.map(t=>`<option value="${esc(t.id)}">${esc(t.nombre)} · ${esc(t.direccion||'Sin dirección')}</option>`).join('')}</select>`;
   else if(type==='maintenance')h+=`<select data-field="${key}"><option value="">Sin mantención asociada</option>${(S.rows.MANTENCIONES||[]).map(m=>`<option value="${esc(m.id)}">${esc(vehicleName(m.vehiculo_id))} · ${esc(m.descripcion||m.id)}</option>`).join('')}</select>`;
   else if(type==='failure')h+=`<select data-field="${key}"><option value="">Sin falla asociada</option>${(S.rows.FALLAS||[]).map(f=>`<option value="${esc(f.id)}">${esc(vehicleName(f.vehiculo_id))} · ${esc(f.titulo||f.id)}</option>`).join('')}</select>`;
   else if(type==='driverassociation')h+=`<select data-field="${key}"><option value="">Sin conductor asociado</option>${S.drivers.filter(c=>!c.usuario_id||String(c.usuario_id)===String(record?.id||'')).map(c=>`<option value="${esc(c.id)}">${esc(c.nombre)} · ${esc(c.rut||'Sin RUT')}</option>`).join('')}</select>`;
   else if(type==='user')h+=`<select data-field="${key}" ${isManagement()?'':'disabled'}><option value="">Sin usuario asociado</option>${S.users.filter(u=>['ROL-CONDUCTOR','ROL-SUPERVISOR-GEO'].includes(normalizeRole(u.rol_id))).map(u=>`<option value="${esc(u.id)}">${esc(u.nombre)} · ${esc(u.correo)}</option>`).join('')}</select>`;
   else h+=`<input data-field="${key}" type="${type}">`;
   h+='</div>';
 }
 $('modalBody').innerHTML=`<div class="record-form-intro"><span>${record?'EDICIÓN SEGURA':'NUEVO REGISTRO'}</span><p>Los cambios quedan vinculados a la empresa activa y registrados para trazabilidad.</p></div><div class="record-form-grid">${h}</div>`;
 if(record){
   $('modalBody').querySelectorAll('[data-field]').forEach(el=>{
     const key=el.dataset.field;let value=record[key]??'';
     if(el.type==='date')value=dateForInput(value);
     el.value=value==null?'':String(value);
   });
 }
 if(k==='usuario'){
   const linked=record?.id?S.drivers.find(c=>String(c.usuario_id||'')===String(record.id)):null;setModalField('conductor_asociado_id',linked?.id||'');convertModalSelectToCards('rol_id');convertModalSelectToCards('estado');
   $('modalBody').querySelector('.record-form-intro p').textContent='La cuenta se crea dentro de la empresa activa. Después podrás abrir su matriz y habilitar cada módulo.';
 }
 if(k==='combustible'){
   const intro=$('modalBody').querySelector('.record-form-intro');intro.querySelector('p').textContent='Registra la carga con kilometraje y evidencia. E-Fleet calcula rendimiento/costo y puede tomar GPS automáticamente.';
   intro.insertAdjacentHTML('afterend',`<div class="fuel-form-tools"><button id="btnFuelFormGps" class="ghost" type="button">⌖ Capturar GPS y dirección</button><span id="fuelFormGpsStatus">${S.fuelPosition?.direccion?`✓ ${esc(S.fuelPosition.direccion)}`:'Ubicación pendiente'}</span></div><div class="record-form-grid"><div class="form-field"><label>Foto odómetro</label><input id="fuelOdometerFile" type="file" accept="image/jpeg,image/png,image/webp"></div><div class="form-field"><label>Boleta / comprobante</label><input id="fuelReceiptFile" type="file" accept="image/jpeg,image/png,image/webp,application/pdf"></div></div>`);
   $('btnFuelFormGps').onclick=async()=>{const p=await captureFuelGps(false);if(p)$('fuelFormGpsStatus').textContent=`✓ ${p.direccion||`${p.latitud.toFixed(5)}, ${p.longitud.toFixed(5)}`}`};
 }
 if(k==='taller'){
   S.activeWorkshopGeo=record?{latitud:record.latitud,longitud:record.longitud,direccion:record.direccion_normalizada||record.direccion,comuna:record.comuna||'',ciudad:record.ciudad||'',region:record.region||''}:null;
   const addressField=$('modalBody').querySelector('[data-field="direccion"]')?.closest('.form-field');
   if(addressField){addressField.classList.add('form-span-full');addressField.insertAdjacentHTML('beforeend',`<div class="workshop-geocode-actions"><button id="btnGeocodeWorkshop" class="ghost" type="button">⌖ Buscar y validar dirección</button><span id="workshopGeocodeStatus">${record?.latitud!=null&&record?.longitud!=null?`✓ Ubicación guardada · ${Number(record.latitud).toFixed(5)}, ${Number(record.longitud).toFixed(5)}`:'Escribe la dirección; E-Fleet obtendrá las coordenadas automáticamente.'}</span></div>`);$('btnGeocodeWorkshop').onclick=()=>geocodeWorkshopAddress(true)}
   $('modalBody').querySelector('.record-form-intro p').textContent='Solo escribe la dirección. E-Fleet buscará la ubicación, normalizará el texto y guardará las coordenadas automáticamente.';
 }
 $('modalSave').textContent=record?'Guardar cambios':'Guardar';
 openOverlay('modal');
}

async function geocodeWorkshopAddress(showToast=false){
 const input=$('modalBody')?.querySelector('[data-field="direccion"]'),status=$('workshopGeocodeStatus');
 const direccion=String(input?.value||'').trim();if(direccion.length<5){if(showToast)toast('Escribe una dirección más completa',true);return null}
 const button=$('btnGeocodeWorkshop');loading(button,true);
 try{
   const j=await api('GEOCODIFICAR_DIRECCION',{direccion},true),g=j.ubicacion||j;
   S.activeWorkshopGeo={latitud:Number(g.latitud),longitud:Number(g.longitud),direccion:g.direccion||direccion,comuna:g.comuna||'',ciudad:g.ciudad||'',region:g.region||''};
   if(input&&g.direccion)input.value=g.direccion;
   if(status)status.textContent=`✓ ${g.comuna||g.ciudad||'Ubicación encontrada'} · ${Number(g.latitud).toFixed(5)}, ${Number(g.longitud).toFixed(5)}`;
   if(showToast)toast('Dirección encontrada y coordenadas listas');
   return S.activeWorkshopGeo;
 }catch(e){S.activeWorkshopGeo=null;if(status)status.textContent='No fue posible ubicar esa dirección. Corrígela e intenta nuevamente.';if(showToast)toast('Dirección: '+e.message,true);return null}
 finally{loading(button,false)}
}

async function saveModal(){
 if(!activeForm)return;const saveBtn=$('modalSave');loading(saveBtn,true);
 const row=activeRecord?{id:activeRecord.id}:{};
 $('modalBody').querySelectorAll('[data-field]').forEach(x=>{
   let v=x.value;
   if(x.type==='number')v=v===''?null:Number(v);
   if(x.type==='date')v=v?new Date(v+'T12:00:00').toISOString():null;
   row[x.dataset.field]=v===''?null:v;
 });
 const requestedDriverId=activeForm.resource==='USUARIOS'?String(row.conductor_asociado_id||''):'';if(activeForm.resource==='USUARIOS')delete row.conductor_asociado_id;
 if(activeCheckinContext&&activeForm.resource==='FALLAS'){
   row.vehiculo_id=activeCheckinContext.vehicleId;row.conductor_id=activeCheckinContext.driverId||null;row.checkin_id=activeCheckinContext.checkinId;row.origen='CHECKIN';row.kilometraje=Number(activeCheckinContext.kilometraje||row.kilometraje||0);
 }
 if(activeCheckinContext&&activeForm.resource==='MANTENCIONES'){
   row.vehiculo_id=activeCheckinContext.vehicleId;const trace=`Origen Check-in ${activeCheckinContext.checkinId}.`;if(!String(row.observaciones||'').includes(activeCheckinContext.checkinId))row.observaciones=`${trace} ${row.observaciones||''}`.trim();
 }
 if(activeForm.resource==='FALLAS'){
   row.origen=row.origen||'MANUAL';row.severidad=row.severidad||row.criticidad;
   row.puede_operar=row.puede_operar||((row.criticidad==='CRITICA')?'NO':'SI');
   row.requiere_inmovilizacion=row.requiere_inmovilizacion||((row.criticidad==='CRITICA')?'SI':'NO');
   if(!activeRecord)row.fecha_detectada=new Date().toISOString();
 }
 if(activeForm.resource==='COMBUSTIBLE'){
   if(!activeRecord)row.fecha_hora=new Date().toISOString();
   if(S.fuelPosition){row.latitud=S.fuelPosition.latitud;row.longitud=S.fuelPosition.longitud;row.precision_gps=S.fuelPosition.precision;row.direccion=S.fuelPosition.direccion||row.direccion;row.origen_ubicacion='GPS'}
 }
 if(activeForm.resource==='VEHICULOS'&&!row.estado)row.estado='ACTIVO';
 if(activeForm.resource==='CONDUCTORES'&&!row.estado)row.estado='Activo';
 try{
   if(activeForm.resource==='TALLERES'){
     const addressChanged=!activeRecord||String(activeRecord.direccion||'').trim()!==String(row.direccion||'').trim();
     if(row.direccion&&(addressChanged||!S.activeWorkshopGeo?.latitud||!S.activeWorkshopGeo?.longitud))await geocodeWorkshopAddress(false);
     if(row.direccion&&!S.activeWorkshopGeo)throw new Error('DIRECCION_NO_ENCONTRADA');
     if(S.activeWorkshopGeo){row.direccion=S.activeWorkshopGeo.direccion||row.direccion;row.direccion_normalizada=S.activeWorkshopGeo.direccion||row.direccion;row.latitud=S.activeWorkshopGeo.latitud;row.longitud=S.activeWorkshopGeo.longitud;row.comuna=S.activeWorkshopGeo.comuna||null;row.ciudad=S.activeWorkshopGeo.ciudad||null;row.region=S.activeWorkshopGeo.region||null;row.geocodificado_en=new Date().toISOString()}
   }
   if(activeForm.resource==='USUARIOS'){
     if(!isManagement())throw new Error('PERMISO_DENEGADO');
     if(!String(row.nombre||'').trim())throw new Error('NOMBRE_REQUERIDO');
     if(!String(row.correo||'').includes('@'))throw new Error('CORREO_INVALIDO');
     if(!activeRecord&&String(row.contrasena||'').length<8)throw new Error('CONTRASENA_MINIMO_8');
     if(requestedDriverId&&!['ROL-CONDUCTOR','ROL-SUPERVISOR-GEO'].includes(normalizeRole(row.rol_id)))throw new Error('SOLO_CONDUCTOR_O_SUPERVISOR_GEO_PUEDE_ASOCIARSE');
   }
   const saved=await api('guardar',{recurso:activeForm.resource,row});
   if(activeForm.resource==='COMBUSTIBLE'){
     const fuelId=saved.row?.id||activeRecord?.id;
     const odo=$('fuelOdometerFile')?.files?.[0],receipt=$('fuelReceiptFile')?.files?.[0];
     for(const [kind,file] of [['ODOMETRO',odo],['BOLETA',receipt]]){
       if(!file)continue;
       try{if(file.size>15*1024*1024)throw new Error('ARCHIVO_MAXIMO_15MB');await api('GUARDAR_EVIDENCIA_COMBUSTIBLE',{id:fuelId,tipo:kind,base64:await fileToBase64(file),mime:file.type,nombreArchivo:file.name})}
       catch(e){console.warn('[combustible][evidencia]',kind,e);toast(`Carga guardada; evidencia ${kind.toLowerCase()} pendiente: ${e.message}`,true)}
     }
   }
   if(activeForm.resource==='USUARIOS'){
     const userId=saved.row?.id||activeRecord?.id,previous=S.drivers.find(c=>String(c.usuario_id||'')===String(userId||''));
     if(previous&&String(previous.id)!==requestedDriverId)await api('guardar',{recurso:'CONDUCTORES',row:{...previous,usuario_id:null}});
     if(requestedDriverId){const target=S.drivers.find(c=>String(c.id)===requestedDriverId);if(!target)throw new Error('CONDUCTOR_ASOCIADO_NO_ENCONTRADO');await api('guardar',{recurso:'CONDUCTORES',row:{...target,usuario_id:userId}})}
   }
   const wasEdit=Boolean(activeRecord);closeModal();toast(wasEdit?'Cambios guardados':'Registro guardado');
   await refresh(document.querySelector('#nav button.active')?.dataset.view||'dashboard');
 }catch(e){toast('No se pudo guardar: '+friendlyError(e.message),true)}finally{loading(saveBtn,false)}
}
async function deleteRecord(formKey,id){
 const form=FORMS[formKey]||((formKey==='asignacion')?{resource:'ASIGNACIONES'}:null);if(!form)return;
 const module=FORM_MODULES[formKey]||form.resource;if(!permissionAllowed(module,'ELIMINAR'))return toast('Tu perfil no tiene permiso para eliminar',true);
 const rec=recordByForm(formKey,id);
 const label=rec?.patente||rec?.nombre||rec?.titulo||rec?.descripcion||id;
 if(!confirm(`¿Eliminar administrativamente "${label}"?\\n\\nEl registro quedará marcado como eliminado y la acción será auditada.`))return;
 try{
   await api('eliminar',{recurso:form.resource,id});
   toast('Registro eliminado');await refresh(document.querySelector('#nav button.active')?.dataset.view||'dashboard');
 }catch(e){toast('No se pudo eliminar: '+e.message,true)}
}
async function approveCheckin(id){
 if(!permissionAllowed('CHECKIN','APROBAR_DIRECTO'))return toast('Tu perfil no tiene permiso para aprobar directamente',true);
 if(!confirm('¿Aprobar directamente este Check-in?\\nSe conservará el resultado técnico original.'))return;
 try{await api('APROBAR_CHECKIN_DIRECTO',{id});toast('Check-in aprobado directamente');await loadCheckin()}
 catch(e){toast('No se pudo aprobar: '+e.message,true)}
}
function closeModal(){$('modal').classList.add('hidden');$('modal').querySelector('.modal-card')?.classList.remove('wide-modal');activeForm=null;activeRecord=null;activeCheckinContext=null;S.activeWorkshopGeo=null;$('modalSave').textContent='Guardar';$('modalSave').classList.remove('hidden');$('modalSave').onclick=saveModal;$('modalCancel').textContent='Cancelar'}




function initials(name){
 const p=String(name||'Usuario').trim().split(/\s+/).filter(Boolean);
 return ((p[0]?.[0]||'U')+(p.length>1?(p[p.length-1]?.[0]||''):'')).toUpperCase();
}
async function loadProfile(){
 try{
   const previousVersion=Number(S.user?.versionPermisos||0),j=await api('PERFIL',{},true);if(j.user)S.user={...S.user,...j.user};
   if(j.empresa){S.company={...(S.company||{}),...j.empresa,nombre:j.empresa.nombre||S.company?.nombre||''};saveConnection(S.company,S.connection?.needsSetup||false)}
   S.perfilOperativo=j.perfilOperativo||S.perfilOperativo;applyPermissionsUi();
   $('profileInitials').textContent=initials(S.user?.nombre);
   $('profileMenuName').textContent=S.user?.nombre||'Usuario';
   $('profileMenuRole').textContent=roleLabel(S.user?.rolId);
   if(S.user?.fotoUrl){
     $('profileImage').src=S.user.fotoUrl;$('profileImage').classList.remove('hidden');$('profileInitials').classList.add('hidden');
   }else{$('profileImage').classList.add('hidden');$('profileInitials').classList.remove('hidden')}
   const active=document.querySelector('.view.active')?.id?.replace('view-',''),module=VIEW_PERMISSIONS[active];
   if(previousVersion&&Number(S.user?.versionPermisos||0)!==previousVersion&&module&&!permissionAllowed(module,'LEER'))showView(firstAllowedView());
 }catch(e){console.warn('perfil',e)}
}
function fileToBase64(file){
 return new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(String(r.result||''));r.onerror=reject;r.readAsDataURL(file)});
}
async function uploadProfilePhoto(file){
 if(!file)return;const btn=$('btnChangePhoto');loading(btn,true);
 try{
  if(file.size>5*1024*1024)throw new Error('La foto no puede superar 5 MB');
  const base64=await fileToBase64(file);
  const j=await api('SUBIR_FOTO_PERFIL',{base64,mime:file.type,nombreArchivo:file.name},true);
  if(j.user)S.user={...S.user,...j.user};await loadProfile();$('profileMenu').classList.add('hidden');toast('Foto de perfil actualizada');
 }catch(e){toast('Foto de perfil: '+e.message,true)}finally{loading(btn,false);$('profileFile').value=''}
}

function docComputedState(d){
 if(!d.fecha_vencimiento)return 'VIGENTE';
 const now=new Date();now.setHours(0,0,0,0);const due=new Date(d.fecha_vencimiento+'T12:00:00');
 const days=Math.ceil((due-now)/86400000);
 if(days<0)return 'VENCIDO';if(days<=Number(d.alerta_dias||30))return 'POR_VENCER';return 'VIGENTE';
}
function documentEntityLabel(d){
 if(String(d.tipo_entidad).toUpperCase()==='VEHICULO'){const v=S.vehicles.find(v=>v.id===d.vehiculo_id);return v?.patente||'Vehículo asociado'}
 const c=S.drivers.find(c=>c.id===d.conductor_id);return c?.nombre||'Conductor asociado';
}
async function loadDocuments(){
 await ensureCatalogs();
 const j=await api('listar',{recurso:'DOCUMENTOS',limit:500});S.documents=j.rows||[];populateAdvancedFilter('documentos',S.documents);
 renderDocuments();
}
function renderDocuments(){
 const rows=advancedFilteredRows('documentos',S.documents||[]);
 const states=S.documents.map(docComputedState);
 $('docKpiTotal').textContent=S.documents.length;$('docKpiOk').textContent=states.filter(x=>x==='VIGENTE').length;
 $('docKpiWarn').textContent=states.filter(x=>x==='POR_VENCER').length;$('docKpiExpired').textContent=states.filter(x=>x==='VENCIDO').length;
 $('documentRows').innerHTML=rows.length?rows.map(d=>{
   const state=docComputedState(d),cls=state==='VENCIDO'?'danger':state==='POR_VENCER'?'warn':'ok',isVeh=d.tipo_entidad==='VEHICULO';
   return `<article class="document-card">
    <div class="document-card-top"><div class="document-entity"><div class="document-entity-icon">${isVeh?'🚙':'👤'}</div><div><h4>${esc(d.tipo_documento)}</h4><p>${esc(documentEntityLabel(d))}</p></div></div><span class="doc-state ${cls}">${esc(state.replace('_',' '))}</span></div>
    <p>N° ${esc(d.numero_documento||'—')} · Vence: ${esc(d.fecha_vencimiento?new Date(d.fecha_vencimiento+'T12:00:00').toLocaleDateString('es-CL'):'Sin vencimiento')}</p>
    <p>${esc(d.nombre_archivo||'Sin archivo adjunto')}</p>
    <div class="document-actions">
      ${d.ruta?`<button class="mini detail" data-doc-view="${esc(d.id)}">Ver archivo</button>`:''}
      ${permissionAllowed('DOCUMENTOS','EDITAR')?`<button class="mini edit" data-doc-edit="${esc(d.id)}">✎ Editar</button>`:''}${permissionAllowed('DOCUMENTOS','ELIMINAR')?`<button class="mini danger" data-doc-delete="${esc(d.id)}">Eliminar</button>`:''}
    </div>
   </article>`;
 }).join(''):'<div class="notification-empty">No hay documentos con estos filtros.</div>';
}
async function openDocumentForm(record=null,prefill=null){
 await ensureCatalogs();
 activeRecord=record;activeForm=null;$('modalTitle').textContent=(record?'Editar':'Nuevo')+' documento';
 const type=record?.tipo_entidad||'VEHICULO';
 $('modalBody').innerHTML=`
  <label>Asociar a</label><select id="docEntityType"><option value="VEHICULO">Vehículo</option><option value="CONDUCTOR">Conductor</option></select>
  <div id="docEntityWrap"></div>
  <label>Tipo de documento</label><select id="docType"><option>Permiso de circulación</option><option>Revisión técnica</option><option>SOAP</option><option>Padrón</option><option>Licencia de conducir</option><option>Cédula de identidad</option><option>Hoja de vida del conductor</option><option>Certificado</option><option>Contrato</option><option>Otro</option></select>
  <label>Número / folio</label><input id="docNumber">
  <div class="form-grid"><div><label>Fecha emisión</label><input id="docIssue" type="date"></div><div><label>Fecha vencimiento</label><input id="docExpiry" type="date"></div><div><label>Alertar antes (días)</label><input id="docAlertDays" type="number" value="30"></div></div>
  <label>Observaciones</label><textarea id="docObs" rows="3"></textarea>
  <label>Archivo privado (PDF/JPG/PNG/WEBP · máximo 15 MB)</label><input id="docFile" type="file" accept="application/pdf,image/jpeg,image/png,image/webp">
 `;
 $('docEntityType').value=prefill?.tipo_entidad||type;
 const renderEntity=()=>{$('docEntityWrap').innerHTML=$('docEntityType').value==='VEHICULO'
   ?`<label>Vehículo</label><select id="docEntityId">${S.vehicles.map(v=>`<option value="${esc(v.id)}">${esc(v.patente)} · ${esc(v.marca||'')} ${esc(v.modelo||'')}</option>`).join('')}</select>`
   :`<label>Conductor</label><select id="docEntityId">${S.drivers.map(c=>`<option value="${esc(c.id)}">${esc(c.nombre)} · ${esc(c.rut||'')}</option>`).join('')}</select>`;
   if(record)$('docEntityId').value=record.vehiculo_id||record.conductor_id||'';
 };
 $('docEntityType').onchange=renderEntity;renderEntity();
 if(prefill){$('docEntityType').value=prefill.tipo_entidad||'CONDUCTOR';renderEntity();if($('docEntityId'))$('docEntityId').value=prefill.conductor_id||prefill.vehiculo_id||'';if(prefill.tipo_documento)$('docType').value=prefill.tipo_documento}
 if(record){$('docType').value=record.tipo_documento||'Otro';$('docNumber').value=record.numero_documento||'';$('docIssue').value=record.fecha_emision||'';$('docExpiry').value=record.fecha_vencimiento||'';$('docAlertDays').value=record.alerta_dias||30;$('docObs').value=record.observaciones||''}
 $('modalSave').onclick=saveDocument;$('modalSave').textContent=record?'Guardar cambios':'Guardar documento';openOverlay('modal');
}
async function saveDocument(){
 const btn=$('modalSave');loading(btn,true);
 try{
   const type=$('docEntityType').value,id=$('docEntityId').value,file=$('docFile').files[0];if(!activeRecord&&!file)throw new Error('Debes adjuntar el archivo del documento');
   const row={id:activeRecord?.id,tipo_entidad:type,vehiculo_id:type==='VEHICULO'?id:null,conductor_id:type==='CONDUCTOR'?id:null,
    tipo_documento:$('docType').value,numero_documento:$('docNumber').value,fecha_emision:$('docIssue').value||null,
    fecha_vencimiento:$('docExpiry').value||null,alerta_dias:Number($('docAlertDays').value||30),observaciones:$('docObs').value,
    estado:'VIGENTE'};
   let payload={row};
   if(file){if(file.size>15*1024*1024)throw new Error('Archivo máximo 15 MB');payload={...payload,base64:await fileToBase64(file),mime:file.type,nombreArchivo:file.name}}
   await api('GUARDAR_DOCUMENTO_ARCHIVO',payload,true);closeModal();toast('Documento guardado');await loadDocuments();
 }catch(e){toast('Documento: '+e.message,true)}finally{loading(btn,false)}
}
async function viewDocument(id,btn){
 loading(btn,true);try{const j=await api('VER_DOCUMENTO',{id},true);if(j.url)window.open(j.url,'_blank','noopener')}catch(e){toast('Documento: '+e.message,true)}finally{loading(btn,false)}
}
async function deleteDocument(id,btn){
 if(!confirm('¿Eliminar administrativamente este documento?'))return;loading(btn,true);
 try{await api('eliminar',{recurso:'DOCUMENTOS',id});toast('Documento eliminado');await loadDocuments()}catch(e){toast(e.message,true)}finally{loading(btn,false)}
}

async function loadAssignments(){await ensureCatalogs();const j=await api('listar',{recurso:'ASIGNACIONES',limit:300});S.assignments=j.rows||[];populateAdvancedFilter('asignaciones',S.assignments);renderAssignments()}
function renderAssignments(){const rows=advancedFilteredRows('asignaciones',S.assignments||[]);$('assignmentRows').innerHTML=rows.length?rows.map(a=>{const v=S.vehicles.find(v=>v.id===a.vehiculo_id)||{},c=S.drivers.find(c=>c.id===a.conductor_id)||{},accepted=String(a.estado||'').toUpperCase()==='ACEPTADA';return `<article class="assignment-card"><div class="assignment-route"><span>🚙 ${esc(a.vehiculo_patente||v.patente||'Vehículo asociado')}</span><span class="assignment-arrow">→</span><span>👤 ${esc(a.conductor_nombre||c.nombre||'Conductor asociado')}</span></div><div class="assignment-meta">${esc(a.observaciones||'Sin observaciones')}<br>${esc(a.fecha_asignacion?new Date(a.fecha_asignacion).toLocaleString('es-CL'):'')}</div><span class="assignment-status ${accepted?'accepted':''}">${esc(a.estado||'PENDIENTE')}</span>${(permissionAllowed('ASIGNACIONES','EDITAR')||permissionAllowed('ASIGNACIONES','ELIMINAR'))?`<div class="card-actions">${permissionAllowed('ASIGNACIONES','EDITAR')?`<button class="mini edit" data-assignment-edit="${esc(a.id)}">✎ Editar</button>`:''}${permissionAllowed('ASIGNACIONES','ELIMINAR')?`<button class="mini danger" data-assignment-delete="${esc(a.id)}">Eliminar</button>`:''}</div>`:''}</article>`}).join(''):'<div class="notification-empty">No hay asignaciones para los filtros seleccionados.</div>'}
async function openAssignmentForm(record=null){
 await ensureCatalogs();activeRecord=record;activeForm=null;$('modalTitle').textContent=(record?'Editar':'Nueva')+' asignación';
 $('modalBody').innerHTML=`<label>Vehículo</label><select id="asgVehicle">${S.vehicles.map(v=>`<option value="${esc(v.id)}">${esc(v.patente)} · ${esc(v.marca||'')} ${esc(v.modelo||'')}</option>`).join('')}</select>
 <label>Conductor</label><select id="asgDriver">${S.drivers.map(c=>`<option value="${esc(c.id)}">${esc(c.nombre)} · ${esc(c.rut||'')}</option>`).join('')}</select>
 <label>Estado</label><select id="asgState"><option value="PENDIENTE_ACEPTACION">Pendiente aceptación</option><option value="ACEPTADA">Aceptada</option><option value="FINALIZADA">Finalizada</option></select>
 <label>Observaciones</label><textarea id="asgObs" rows="3"></textarea>`;
 if(record){$('asgVehicle').value=record.vehiculo_id;$('asgDriver').value=record.conductor_id;$('asgState').value=record.estado;$('asgObs').value=record.observaciones||''}
 $('modalSave').onclick=saveAssignment;$('modalSave').textContent=record?'Guardar cambios':'Asignar y notificar';openOverlay('modal');
}
async function saveAssignment(){
 const btn=$('modalSave');loading(btn,true);
 try{await api('guardar',{recurso:'ASIGNACIONES',row:{id:activeRecord?.id,vehiculo_id:$('asgVehicle').value,conductor_id:$('asgDriver').value,estado:$('asgState').value,observaciones:$('asgObs').value}},true);
 closeModal();toast('Asignación guardada y notificación emitida');await loadAssignments();await loadNotifications(false)}catch(e){toast('Asignación: '+e.message,true)}finally{loading(btn,false)}
}
function checkAssignmentEmergency(){
 if($('assignmentEmergency')&&!$('assignmentEmergency').classList.contains('hidden'))return;
 const n=(S.notifications||[]).find(n=>String(n.categoria||'').toUpperCase()==='ASIGNACION'&&String(n.requiere_aceptacion||'NO').toUpperCase()==='SI'&&String(n.estado_respuesta||'PENDIENTE').toUpperCase()==='PENDIENTE');
 if(!n)return;S.pendingAssignment=n;$('assignmentEmergencyText').textContent=n.mensaje||'Tienes un vehículo nuevo asignado.';openOverlay('assignmentEmergency');
}
async function acceptPendingAssignment(){
 const n=S.pendingAssignment;if(!n)return;const btn=$('btnAssignmentAccept');loading(btn,true);
 try{await api('ACEPTAR_ASIGNACION',{id:n.entidad_id},true);$('assignmentEmergency').classList.add('hidden');S.pendingAssignment=null;toast('Vehículo aceptado');await loadNotifications(false)}catch(e){toast('Asignación: '+e.message,true)}finally{loading(btn,false)}
}

function notificationIcon(n){
 const cat=String(n.categoria||n.entidad_tipo||'').toUpperCase();
 if(cat.includes('CHECK'))return '✓';
 if(cat.includes('FALLA'))return '⚠';
 if(cat.includes('MANT'))return '🔧';
 if(cat.includes('COMB'))return '⛽';
 return '🔔';
}
function notificationPriorityClass(n){
 const p=String(n.prioridad||'').toUpperCase();
 return /CRIT|URG/.test(p)?'critical':/ALTA|HIGH/.test(p)?'high':'';
}
async function loadNotifications(showErrors=true){
 if(!S.token)return;
 try{
   const j=await api('NOTIFICACIONES_MIAS',{limit:120});
   const currentPermissionVersion=Number(S.user?.versionPermisos||1),serverPermissionVersion=Number(j.versionPermisos||currentPermissionVersion);
   if(serverPermissionVersion!==currentPermissionVersion)await loadProfile();
   S.notifications=j.rows||[];populateAdvancedFilter('notificaciones',S.notifications);S.notificationPending=(S.notifications||[]).filter(n=>String(n.leida||'NO').toUpperCase()!=='SI'||(String(n.requiere_aceptacion||'NO').toUpperCase()==='SI'&&String(n.estado_respuesta||'PENDIENTE').toUpperCase()==='PENDIENTE'));
   const serverUnread=Number(j.noLeidas||0);S.zeroUnreadSnapshots=serverUnread===0?Number(S.zeroUnreadSnapshots||0)+1:0;
   const unread=(serverUnread===0&&Number(S.lastUnread||0)>0&&S.zeroUnreadSnapshots<2)?Number(S.lastUnread):serverUnread;S.lastUnread=unread;
   const count=$('notificationCount');
   if(count){count.textContent=unread>99?'99+':String(unread);count.classList.toggle('hidden',unread<=0)}
   $('btnNotifications')?.classList.toggle('has-alerts',unread>0);$('btnNotifications')?.classList.toggle('critical-alert',S.notifications.some(n=>notificationPriorityClass(n)==='critical'&&(String(n.leida||'NO').toUpperCase()!=='SI'||String(n.estado_respuesta||'').toUpperCase()==='PENDIENTE')));
   if($('notificationSummary'))$('notificationSummary').textContent=unread?`${unread} pendiente${unread===1?'':'s'}`:'Sin notificaciones pendientes';
   renderNotifications();renderNotificationPage(unread);checkAssignmentEmergency();
 }catch(e){if(showErrors)toast('Notificaciones: '+e.message,true)}
}
function renderNotifications(){
 const box=$('notificationRows');if(!box)return;
 const rows=S.notificationPending||[];
 box.innerHTML=rows.length?rows.map(n=>{
   const awaiting=String(n.requiere_aceptacion||'NO').toUpperCase()==='SI'&&String(n.estado_respuesta||'PENDIENTE').toUpperCase()==='PENDIENTE';
   const unread=String(n.leida||'NO').toUpperCase()!=='SI'||awaiting;
   const when=n.fecha_hora?new Date(n.fecha_hora).toLocaleString('es-CL'):'';
   return `<div class="notification-item ${unread?'unread':''} ${notificationPriorityClass(n)}" data-notification-id="${esc(n.id)}">
      <div class="notification-symbol">${notificationIcon(n)}</div>
      <div class="notification-main">
        <strong>${esc(n.titulo||'Notificación')}</strong>
        <p>${esc(n.mensaje_legible||n.mensaje||'')}</p>
        ${(n.vehiculo_patente||n.responsable_nombre||n.usuario_nombre||n.taller_nombre)?`<div class="notification-context">${n.vehiculo_patente?`<span>🚙 <b>${esc(n.vehiculo_patente)}</b>${n.vehiculo_descripcion?` · ${esc(n.vehiculo_descripcion)}`:''}</span>`:''}${n.responsable_nombre?`<span>👤 Responsable: <b>${esc(n.responsable_nombre)}</b></span>`:n.usuario_nombre?`<span>👤 Usuario: <b>${esc(n.usuario_nombre)}</b></span>`:''}${n.taller_nombre?`<span>🏭 ${esc(n.taller_nombre)}</span>`:''}</div>`:''}
        <div class="notification-meta">
          <span>${esc(n.categoria||n.entidad_tipo||'Sistema')}</span>
          <span>·</span><span>${esc(when)}</span>
          ${awaiting?'<span>· Respuesta pendiente</span>':''}
          ${String(n.silenciosa||'NO').toUpperCase()==='SI'?'<span>· Silenciosa</span>':''}
        </div>
      </div>
   </div>`;
 }).join(''):'<div class="notification-empty">No hay notificaciones para mostrar.</div>';
}
function renderNotificationPage(unread=Number(S.lastUnread||0)){
 if(!$('notificationPageRows'))return;const rows=advancedFilteredRows('notificaciones',S.notifications||[]),critical=rows.filter(n=>notificationPriorityClass(n)==='critical'&&String(n.leida||'NO').toUpperCase()!=='SI').length,high=rows.filter(n=>notificationPriorityClass(n)==='high'&&String(n.leida||'NO').toUpperCase()!=='SI').length,pending=rows.filter(n=>String(n.estado_respuesta||'').toUpperCase()==='PENDIENTE').length;
 $('notificationKpis').innerHTML=ringKpi('Pendientes',unread,Math.min(100,unread*12),unread?'amber':'green','Campana autoritativa')+ringKpi('Críticas',critical,Math.min(100,critical*25),critical?'red':'green','Atención inmediata')+ringKpi('Prioridad alta',high,Math.min(100,high*20),high?'amber':'green','Gestión prioritaria')+ringKpi('Respuesta requerida',pending,Math.min(100,pending*25),pending?'blue':'green','Asignaciones abiertas');
 $('notificationPageRows').innerHTML=rows.length?rows.map(n=>{const awaiting=String(n.estado_respuesta||'').toUpperCase()==='PENDIENTE',unreadRow=String(n.leida||'NO').toUpperCase()!=='SI'||awaiting,when=n.fecha_hora?new Date(n.fecha_hora).toLocaleString('es-CL'):'';return `<article class="notification-page-card ${unreadRow?'unread':''} ${notificationPriorityClass(n)}" data-notification-id="${esc(n.id)}"><div class="notification-symbol">${notificationIcon(n)}</div><div><div class="notification-card-title"><strong>${esc(n.titulo||'Notificación')}</strong><span>${esc(n.prioridad||'NORMAL')}</span></div><p>${esc(n.mensaje_legible||n.mensaje||'')}</p>${(n.vehiculo_patente||n.responsable_nombre||n.usuario_nombre)?`<div class="notification-context page">${n.vehiculo_patente?`<span>🚙 <b>${esc(n.vehiculo_patente)}</b>${n.vehiculo_descripcion?` · ${esc(n.vehiculo_descripcion)}`:''}</span>`:''}${n.responsable_nombre?`<span>👤 ${esc(n.responsable_nombre)}</span>`:n.usuario_nombre?`<span>👤 ${esc(n.usuario_nombre)}</span>`:''}</div>`:''}<small>${esc(n.categoria||n.entidad_tipo||'Sistema')} · ${esc(when)}${awaiting?' · Respuesta pendiente':''}</small></div></article>`}).join(''):'<div class="notification-empty">No existen alertas para esta cuenta.</div>';
}
function openNotifications(){
 $('notificationCenter')?.classList.remove('hidden');
 loadNotifications(false);
}
function closeNotifications(){$('notificationCenter')?.classList.add('hidden')}
async function markNotification(id){
 try{await api('MARCAR_NOTIFICACION',{id});await loadNotifications(false)}
 catch(e){toast('No fue posible marcar la notificación: '+e.message,true)}
}
async function markAllNotifications(){
 try{await api('MARCAR_TODAS_NOTIFICACIONES',{});await loadNotifications(false);toast('Notificaciones marcadas como leídas')}
 catch(e){toast('No fue posible marcar todas: '+e.message,true)}
}

function nexoCollapsed(){return localStorage.getItem('efm_nexo_collapsed')==='1'}
function syncNexoVisibility(){
 const allowed=permissionAllowed('PREDICCIONES','GENERAR'),collapsed=nexoCollapsed();
 const dock=$('nexoDock'),fab=$('nexoFab'),toggle=$('nexoVisibilityToggle');
 // R1.8.8: una sola geometría autoritativa. El dock siempre está fijado con RIGHT.
 // Nunca se usa left ni un translateX negativo para ocultar NEXO; por eso el círculo
 // no puede saltar al costado izquierdo en escritorio, móvil o cambios de orientación.
 if(dock){
  dock.classList.toggle('hidden',!allowed);
  dock.classList.toggle('collapsed',allowed&&collapsed);
  dock.dataset.state=collapsed?'collapsed':'expanded';
 }
 if(toggle){
  toggle.classList.toggle('hidden',!allowed);
  toggle.classList.toggle('collapsed',collapsed);
  toggle.textContent=collapsed?'‹':'›';
  toggle.setAttribute('aria-label',collapsed?'Mostrar círculo de NEXO IA':'Ocultar círculo de NEXO IA');
  toggle.title=collapsed?'Mostrar círculo de NEXO IA':'Ocultar círculo de NEXO IA';
  toggle.setAttribute('aria-expanded',collapsed?'false':'true');
 }
 if(fab){
  fab.classList.toggle('hidden',!allowed);
  fab.classList.remove('nexo-hidden-by-toggle','nexo-collapsed');
  fab.setAttribute('aria-label','Abrir NEXO IA');
  fab.title='Abrir NEXO IA';
 }
 if(!allowed||collapsed)$('nexoPanel')?.classList.add('hidden');
}
function toggleNexoVisibility(){
 if(toggleNexoVisibility.busy)return;
 toggleNexoVisibility.busy=true;
 const willCollapse=!nexoCollapsed();
 localStorage.setItem('efm_nexo_collapsed',willCollapse?'1':'0');
 syncNexoVisibility();
 window.setTimeout(()=>{toggleNexoVisibility.busy=false},260);
}

function nexoOpen(){
  if(nexoCollapsed()){
    localStorage.setItem('efm_nexo_collapsed','0');
    syncNexoVisibility();
  }
  $('nexoPanel')?.classList.remove('hidden');
  setTimeout(()=>$('nexoInput')?.focus(),50);
}
function nexoClose(){
  $('nexoPanel')?.classList.add('hidden');
}
function nexoAdd(textValue,who='assistant',extra=''){
  const box=$('nexoMessages'); if(!box)return null;
  const div=document.createElement('div');
  div.className=`nexo-msg ${who} ${extra}`.trim();
  div.textContent=textValue;
  box.appendChild(div);
  box.scrollTop=box.scrollHeight;
  return div;
}
async function nexoAsk(question){
  question=String(question||'').trim();
  if(!question)return;
  nexoOpen();
  nexoAdd(question,'user');
  const input=$('nexoInput'); if(input)input.value='';
  const pending=nexoAdd('Consultando NEXO IA tu Asistente Virtual…','assistant','loading');
  const send=$('nexoSend'); if(send)send.disabled=true;
  try{
    const j=await api('nexo',{pregunta:question},true);
    pending?.remove();
    const mode=j.iaDisponible ? `IA · ${j.modelo||'Gemini'}` : 'NEXO local · IA externa no configurada';
    nexoAdd(`${j.respuesta||'Sin respuesta'}\n\n${mode}`,'assistant');
  }catch(e){
    pending?.remove();
    nexoAdd(`No pude completar el análisis: ${e.message}`,'assistant');
  }finally{
    if(send)send.disabled=false;
  }
}


function faultById(id){return (S.rows.FALLAS||[]).find(x=>String(x.id)===String(id))}
async function openFaultDetail(id){
 const f=faultById(id);if(!f)return;
 $('modalTitle').textContent=`Falla · ${f.titulo||'Detalle'}`;$('modal').querySelector('.modal-card').classList.add('wide-modal');
 let trace=[],evidences=[],maintenance=[],orders=[];
 try{const j=await api('DETALLE_FALLA',{id},true);trace=j.historial||[];evidences=j.evidencias||[];maintenance=j.mantenciones||[];orders=j.ordenes||[]}catch(e){console.warn('[falla][detalle]',e)}
 const vehicle=f.vehiculo_patente||vehicleName(f.vehiculo_id),driver=f.conductor_nombre||driverName(f.conductor_id),user=f.creado_por_nombre||userName(f.creado_por);
 $('modalBody').innerHTML=`<div class="life-identity"><span class="life-icon">⚠</span><div><span class="profile-label">FALLA REGISTRADA</span><h3>${esc(f.titulo||'Falla')}</h3><p>🚙 ${esc(vehicle)}${driver?` · 👤 ${esc(driver)}`:''}</p></div></div>
 <div class="fault-detail-grid"><div><small>CRITICIDAD</small><strong>${esc(f.criticidad||f.severidad||'MEDIA')}</strong></div><div><small>ESTADO</small><strong>${esc(f.estado||'DETECTADA')}</strong></div><div><small>KILOMETRAJE</small><strong>${Number(f.kilometraje||0).toLocaleString('es-CL')} km</strong></div><div><small>REPORTADO POR</small><strong>${esc(user||driver||'Perfil asociado')}</strong></div><div><small>FECHA</small><strong>${esc(f.fecha_detectada?new Date(f.fecha_detectada).toLocaleString('es-CL'):'—')}</strong></div><div><small>UBICACIÓN</small><strong>${esc(f.direccion||'Sin ubicación')}</strong></div></div>
 <h4>Comentario / descripción</h4><div class="fault-long-text">${esc(f.descripcion||'Sin comentario adicional.')}</div>
 ${f.diagnostico_tecnico?`<h4>Diagnóstico técnico</h4><div class="fault-long-text">${esc(f.diagnostico_tecnico)}</div>`:''}
 ${f.recomendacion?`<h4>Recomendación</h4><div class="fault-long-text">${esc(f.recomendacion)}</div>`:''}
 ${lifeList('Evidencias',evidences,x=>`<div class="life-row"><span>📷</span><div><strong>${esc(x.nombre||x.tipo||'Evidencia')}</strong><small>${esc(x.descripcion||x.mime||'')}</small></div></div>`)}
 ${lifeList('Trazabilidad',trace,x=>`<div class="life-row"><span>↺</span><div><strong>${esc(x.estado_nuevo||'Actualización')}</strong><small>${esc(x.detalle||'')} · ${esc(x.fecha_hora?new Date(x.fecha_hora).toLocaleString('es-CL'):'')}</small></div></div>`)}
 ${lifeList('Mantenciones asociadas',maintenance,x=>`<div class="life-row"><span>🔧</span><div><strong>${esc(x.descripcion||'Mantención')}</strong><small>${esc(x.estado||'')}</small></div></div>`)}
 ${lifeList('Órdenes de servicio',orders,x=>`<div class="life-row"><span>📋</span><div><strong>${esc(x.titulo||serviceOrderNumber(x))}</strong><small>${esc(x.estado||'')}</small></div></div>`)}
 <div class="card-actions">${permissionAllowed('MANTENCIONES','GESTIONAR')?`<button class="mini edit" data-new-maintenance="${esc(f.vehiculo_id)}">+ Mantención</button>`:''}${permissionAllowed('FALLAS','GESTIONAR')?`<button class="mini edit" data-edit-form="falla" data-id="${esc(f.id)}">✎ Gestionar falla</button>`:''}</div>`;
 $('modalSave').classList.add('hidden');$('modalCancel').textContent='Cerrar';openOverlay('modal');
}
async function openDriverDocuments(id){
 const c=S.drivers.find(x=>String(x.id)===String(id));if(!c)return;
 if(permissionAllowed('DOCUMENTOS','LEER')){try{const j=await api('listar',{recurso:'DOCUMENTOS',conductor_id:id,limit:200});S.documents=(S.documents||[]).filter(d=>String(d.conductor_id)!==String(id)).concat(j.rows||[])}catch(e){toast('Documentación: '+e.message,true)}}
 const docs=(S.documents||[]).filter(d=>String(d.conductor_id||'')===String(id));
 $('modalTitle').textContent=`Documentación · ${c.nombre}`;$('modal').querySelector('.modal-card').classList.add('wide-modal');
 const buttons=permissionAllowed('DOCUMENTOS','CREAR')?`<div class="driver-doc-actions"><button class="mini detail" data-driver-doc-add="${esc(id)}" data-doc-kind="Licencia de conducir">+ Licencia</button><button class="mini detail" data-driver-doc-add="${esc(id)}" data-doc-kind="Cédula de identidad">+ Cédula</button><button class="mini detail" data-driver-doc-add="${esc(id)}" data-doc-kind="Hoja de vida del conductor">+ Hoja de vida</button><button class="mini detail" data-driver-doc-add="${esc(id)}" data-doc-kind="Otro">+ Otro</button></div>`:'';
 $('modalBody').innerHTML=`<div class="life-identity"><span class="life-icon">📄</span><div><span class="profile-label">MISMO MÓDULO DOCUMENTOS</span><h3>${esc(c.nombre)}</h3><p>Todo lo cargado aquí queda registrado en Documentos con este conductor y la empresa activa.</p></div></div>${buttons}<div class="document-grid">${docs.length?docs.map(d=>{const st=docComputedState(d),cl=st==='VENCIDO'?'danger':st==='POR_VENCER'?'warn':'ok';return `<article class="document-card"><div class="document-card-top"><div><h4>${esc(d.tipo_documento)}</h4><p>${esc(d.numero_documento||'Sin número')}</p></div><span class="doc-state ${cl}">${esc(st.replace('_',' '))}</span></div><p>Vence: ${esc(d.fecha_vencimiento?new Date(d.fecha_vencimiento+'T12:00:00').toLocaleDateString('es-CL'):'Sin vencimiento')}</p><div class="document-actions">${d.ruta?`<button class="mini detail" data-doc-view="${esc(d.id)}">Ver archivo</button>`:''}${permissionAllowed('DOCUMENTOS','EDITAR')?`<button class="mini edit" data-doc-edit="${esc(d.id)}">Editar</button>`:''}</div></article>`}).join(''):'<div class="notification-empty">Sin documentos cargados para este conductor.</div>'}</div>`;
 $('modalSave').classList.add('hidden');$('modalCancel').textContent='Cerrar';openOverlay('modal');
}

let qrDetector=null;
async function openQrScanner(){
 $('qrScannerModal').classList.remove('hidden');$('qrScannerInput').value='';$('qrScannerStatus').textContent='Preparando cámara…';$('qrScannerStatus').className='qr-scanner-status';
 try{if('BarcodeDetector' in window)qrDetector=new BarcodeDetector({formats:['qr_code']})}catch{qrDetector=null}
 // R1.8.8: un solo toque abre el escáner e intenta iniciar la cámara.
 // Si el navegador no autoriza cámara o no ofrece detector QR, el código manual sigue disponible.
 await startQrScanner();
}
function stopQrScanner(){
 if(S.qrScanTimer){clearTimeout(S.qrScanTimer);S.qrScanTimer=null}
 if(S.qrStream){for(const t of S.qrStream.getTracks())t.stop();S.qrStream=null}
 const v=$('qrScannerVideo');if(v)v.srcObject=null;
}
function closeQrScanner(){stopQrScanner();$('qrScannerModal').classList.add('hidden')}
async function validateQrValue(value){
 const status=$('qrScannerStatus');try{const j=await api('VALIDAR_QR_CHECKIN',{qrValue:String(value||'').trim()},true);if(!j.valido)throw new Error('QR_INVALIDO');status.textContent=`✓ QR válido · ${j.vehiculo?.patente||'Vehículo'} · ${Math.ceil(Number(j.restanteSegundos||0)/60)} min restantes`;status.className='qr-scanner-status ok';if(j.vehiculo?.id){selectCheckinVehicle(j.vehiculo.id,true);if(!$('ciKm').value&&j.vehiculo.kilometraje)$('ciKm').value=j.vehiculo.kilometraje;closeQrScanner();toast(`QR validado · ${j.vehiculo.patente||vehicleName(j.vehiculo.id)}`)}return j}catch(e){status.textContent='✕ '+friendlyError(e.message);status.className='qr-scanner-status error';throw e}
}
async function scanQrFrame(){
 if(!S.qrStream||!qrDetector)return;try{const codes=await qrDetector.detect($('qrScannerVideo'));if(codes?.[0]?.rawValue){$('qrScannerInput').value=codes[0].rawValue;await validateQrValue(codes[0].rawValue);return}}catch(e){console.warn('[qr][scan]',e)}
 S.qrScanTimer=setTimeout(scanQrFrame,450);
}
async function startQrScanner(){
 const b=$('qrScannerStart');loading(b,true);
 try{
  stopQrScanner();
  if(!navigator.mediaDevices?.getUserMedia)throw new Error('CAMARA_NO_DISPONIBLE_EN_ESTE_NAVEGADOR');
  S.qrStream=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:'environment'}},audio:false});
  $('qrScannerVideo').srcObject=S.qrStream;await $('qrScannerVideo').play();
  const status=$('qrScannerStatus');
  status.className='qr-scanner-status';
  status.textContent=qrDetector?'Cámara activa · apunta al QR dentro del marco.':'Cámara activa · este navegador no ofrece lectura QR automática. Puedes pegar el código abajo.';
  if(qrDetector)scanQrFrame();
 }catch(e){
  const status=$('qrScannerStatus');
  status.textContent='No fue posible iniciar la cámara. Puedes validar pegando el código QR abajo. · '+friendlyError(e.message);
  status.className='qr-scanner-status error';
 }finally{loading(b,false)}
}

function blobToDataUrl(blob){return new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=reject;r.readAsDataURL(blob)})}
function openVoiceCommand(kind,context=null){
 S.voiceKind=kind;S.voiceContext=context;S.voiceBlob=null;S.voiceChunks=[];$('voiceTranscript').value='';$('voiceRecord').classList.remove('recording');$('voiceStatus').textContent='Presiona para grabar';
 const titles={FALLA:'Reportar falla por voz',NOTIFICACION:'Enviar notificación por voz',CHECKIN:'Comando de voz desde Check-in'};$('voiceTitle').textContent=titles[kind]||'Comando de voz';$('voiceSubtitle').textContent='Habla de forma natural. NEXO identifica la intención y respeta tu perfil y empresa.';$('voiceModal').classList.remove('hidden')
}
async function toggleVoiceRecording(){
 const button=$('voiceRecord');
 if(S.voiceRecorder&&S.voiceRecorder.state==='recording'){S.voiceRecorder.stop();return}
 try{
  const stream=await navigator.mediaDevices.getUserMedia({audio:true});const rec=new MediaRecorder(stream);S.voiceChunks=[];S.voiceRecorder=rec;
  rec.ondataavailable=e=>{if(e.data?.size)S.voiceChunks.push(e.data)};
  rec.onstop=()=>{S.voiceBlob=new Blob(S.voiceChunks,{type:rec.mimeType||'audio/webm'});for(const t of stream.getTracks())t.stop();button.classList.remove('recording');$('voiceStatus').textContent=`Nota lista · ${Math.max(1,Math.round(S.voiceBlob.size/1024))} KB`};
  rec.start();button.classList.add('recording');$('voiceStatus').textContent='Grabando… vuelve a presionar para detener';
 }catch(e){toast('Micrófono: '+e.message,true)}
}
function closeVoiceModal(){if(S.voiceRecorder?.state==='recording')S.voiceRecorder.stop();$('voiceModal').classList.add('hidden')}
async function sendVoiceCommand(){
 const b=$('voiceSend');loading(b,true);try{
  const transcript=String($('voiceTranscript').value||'').trim();let audioBase64=null,mime=null;
  if(S.voiceBlob){audioBase64=await blobToDataUrl(S.voiceBlob);mime=S.voiceBlob.type||'audio/webm'}
  if(!transcript&&!audioBase64)throw new Error('GRABA_O_ESCRIBE_LA_INSTRUCCION');
  const ctx=S.voiceContext||{},j=await api('COMANDO_VOZ',{tipo:S.voiceKind,transcripcion:transcript,audioBase64,mime,vehiculo_id:ctx.vehicleId||$('ciVehicle')?.value||null,conductor_id:ctx.driverId||$('ciDriver')?.value||null,checkin_id:ctx.checkinId||S.lastCheckinSaved?.checkinId||null,kilometraje:ctx.kilometraje||Number($('ciKm')?.value||0)},true);
  if(S.voiceKind==='CHECKIN'&&j.transcripcion){$('ciObs').value=[$('ciObs').value,j.transcripcion].filter(Boolean).join('\n');invalidateSavedCheckin()}
  closeVoiceModal();toast(j.mensaje||'Comando de voz procesado');if(S.voiceKind==='FALLA')await refresh('fallas');if(S.voiceKind==='NOTIFICACION')await loadNotifications(false)
 }catch(e){toast('Voz: '+friendlyError(e.message),true)}finally{loading(b,false)}
}

document.addEventListener('DOMContentLoaded',()=>{
 document.documentElement.dataset.efleetWebVersion=WEB_VERSION;
 document.addEventListener('pointerdown',e=>{const b=e.target.closest('button');if(!b||b.disabled)return;S.actionButton=b;S.actionButtonAt=Date.now();b.classList.add('ux-feedback-button')},true);
 document.addEventListener('click',e=>{const b=e.target.closest('button');if(!b||b.disabled)return;b.classList.add('ux-feedback-button');if(!b.classList.contains('is-loading')){b.classList.add('tap-loading');setTimeout(()=>b.classList.remove('tap-loading'),360)}},true);
 renderChecklist();
 loadConnection();$('rut').value=S.company?.rut||localStorage.getItem('efm_rut')||'';
 $('btnResolve').onclick=resolveCompany;$('btnSetup').onclick=setup;$('btnLogin').onclick=login;$('btnLogout').onclick=()=>logout(true);$('btnChangeCompany').onclick=()=>clearConnection(false);$('btnClearConnection').onclick=()=>clearConnection(true);
 $('sidebarToggle').onclick=toggleSidebar;$('sidebarClose').onclick=closeSidebar;$('sidebarBackdrop').onclick=closeSidebar;
 window.addEventListener('resize',()=>{restoreSidebarState();syncNexoVisibility()});
 window.addEventListener('orientationchange',()=>setTimeout(syncNexoVisibility,80));
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&$('appView')?.classList.contains('sidebar-open'))closeSidebar()});
 document.querySelectorAll('[data-back]').forEach(x=>x.onclick=()=>clearConnection(false));
 document.querySelectorAll('#nav button').forEach(x=>x.onclick=()=>showView(x.dataset.view));
 document.querySelectorAll('[data-open-form]').forEach(x=>x.onclick=()=>openForm(x.dataset.openForm));
 document.addEventListener('click',e=>{
   const edit=e.target.closest('[data-edit-form]');
   if(edit){const rec=recordByForm(edit.dataset.editForm,edit.dataset.id);if(rec)openForm(edit.dataset.editForm,rec);return;}
   const del=e.target.closest('[data-delete-form]');
   if(del){deleteRecord(del.dataset.deleteForm,del.dataset.id);return;}
   const app=e.target.closest('[data-approve-checkin]');
   if(app){approveCheckin(app.dataset.approveCheckin);return;}
   const detail=e.target.closest('[data-checkin-detail]');
   if(detail){openCheckinDetail(detail.dataset.checkinDetail);return;}
   const evidence=e.target.closest('[data-checkin-evidence]');if(evidence){openCheckinEvidence(evidence.dataset.checkinEvidence);return;}
   const scheduleDelete=e.target.closest('[data-checkin-schedule-delete]');if(scheduleDelete){cancelCheckinSchedule(scheduleDelete.dataset.checkinScheduleDelete);return;}
   const checkPdf=e.target.closest('[data-checkin-pdf]');if(checkPdf){downloadCheckinPdf(checkPdf.dataset.checkinPdf);return;}
   const workshopMap=e.target.closest('[data-workshop-map]');if(workshopMap){openWorkshopMap(workshopMap.dataset.workshopMap);return;}
   const orderFromMaintenance=e.target.closest('[data-order-from-maintenance]');if(orderFromMaintenance){openOrderFromMaintenance(orderFromMaintenance.dataset.orderFromMaintenance);return;}
   const orderPdf=e.target.closest('[data-order-pdf]');if(orderPdf){downloadServiceOrderPdf(orderPdf.dataset.orderPdf);return;}
   const lifeVehicle=e.target.closest('[data-life-vehicle]');if(lifeVehicle){openVehicleLife(lifeVehicle.dataset.lifeVehicle);return;}
   const lifeDriver=e.target.closest('[data-life-driver]');if(lifeDriver){openDriverLife(lifeDriver.dataset.lifeDriver);return;}
   const driverDocs=e.target.closest('[data-driver-docs]');if(driverDocs){openDriverDocuments(driverDocs.dataset.driverDocs);return;}
   const driverDocAdd=e.target.closest('[data-driver-doc-add]');if(driverDocAdd){closeModal();openDocumentForm(null,{tipo_entidad:'CONDUCTOR',conductor_id:driverDocAdd.dataset.driverDocAdd,tipo_documento:driverDocAdd.dataset.docKind});return;}
   const faultOpen=e.target.closest('[data-fault-open]');if(faultOpen&&!e.target.closest('[data-edit-form],[data-delete-form]')){openFaultDetail(faultOpen.dataset.faultOpen);return;}
   const fuelNav=e.target.closest('[data-fuel-nav]');if(fuelNav){window.open('https://www.google.com/maps/dir/?api=1&destination='+encodeURIComponent(fuelNav.dataset.fuelNav),'_blank','noopener');return;}
   const newMaintenance=e.target.closest('[data-new-maintenance]');if(newMaintenance){openMaintenanceForVehicle(newMaintenance.dataset.newMaintenance);return;}
   const userPermissions=e.target.closest('[data-user-permissions]');if(userPermissions){openUserPermissions(userPermissions.dataset.userPermissions);return;}
   const rolePermissions=e.target.closest('[data-role-permissions]');if(rolePermissions){openRolePermissions(rolePermissions.dataset.rolePermissions);return;}
   const currentFailure=e.target.closest('[data-current-checkin-failure]');if(currentFailure){openCheckinFailure(S.lastCheckinSaved,currentFailure.dataset.currentCheckinFailure);return;}
   const currentMaintenance=e.target.closest('[data-current-checkin-maintenance]');if(currentMaintenance){openCheckinMaintenance(S.lastCheckinSaved,currentMaintenance.dataset.currentCheckinMaintenance);return;}
   const checkinFailure=e.target.closest('[data-checkin-create-failure]');if(checkinFailure){openHistoricalCheckinAction(checkinFailure.dataset.checkinCreateFailure,'falla');return;}
   const checkinMaintenance=e.target.closest('[data-checkin-create-maintenance]');if(checkinMaintenance){openHistoricalCheckinAction(checkinMaintenance.dataset.checkinCreateMaintenance,'mantencion','CORRECTIVA');return;}
   const note=e.target.closest('[data-notification-id]');
   if(note){markNotification(note.dataset.notificationId);return;}
   const dv=e.target.closest('[data-doc-view]');if(dv){viewDocument(dv.dataset.docView,dv);return;}
   const de=e.target.closest('[data-doc-edit]');if(de){openDocumentForm(S.documents.find(x=>String(x.id)===String(de.dataset.docEdit)));return;}
   const dd=e.target.closest('[data-doc-delete]');if(dd){deleteDocument(dd.dataset.docDelete,dd);return;}
   const ae=e.target.closest('[data-assignment-edit]');if(ae){openAssignmentForm(S.assignments.find(x=>String(x.id)===String(ae.dataset.assignmentEdit)));return;}
   const ad=e.target.closest('[data-assignment-delete]');if(ad){deleteRecord('asignacion',ad.dataset.assignmentDelete);return;}
 });

 $('btnSaveCheckin').onclick=saveCheckin;
 $('btnProgramCheckin').onclick=openCheckinSchedule;$('btnProgramCheckinSecondary').onclick=openCheckinSchedule;$('btnGoCheckinHistory').onclick=()=>showView('checkinhistorial');$('btnGoCheckinApprovals').onclick=()=>showView('checkinaprobaciones');
 $('btnMarkAllConforme').onclick=()=>setAllCheckStates('CONFORME');
 $('btnNewCheckin').onclick=resetCheckinWorkspace;
 $('ciKm').addEventListener('input',()=>{invalidateSavedCheckin();if($('ciKmStatus')){$('ciKmStatus').textContent=Number($('ciKm').value||0)>0?'KM listo para confirmar':'Pendiente de confirmar';$('ciKmStatus').classList.toggle('ok',Number($('ciKm').value||0)>0)}});$('ciObs').addEventListener('input',invalidateSavedCheckin);$('ciEvidenceFiles').addEventListener('change',()=>{$('ciEvidenceHint').textContent=`${$('ciEvidenceFiles').files.length} archivo(s) seleccionado(s)`});
 $('btnGenerateCheckinQr').onclick=generateCheckinQr;
 $('btnScanCheckinQr').onclick=openQrScanner;$('qrScannerClose').onclick=closeQrScanner;$('qrScannerStart').onclick=startQrScanner;$('qrScannerValidate').onclick=()=>validateQrValue($('qrScannerInput').value).catch(()=>{});$('qrScannerModal').addEventListener('click',e=>{if(e.target===$('qrScannerModal'))closeQrScanner()});
 $('btnCheckinVoice').onclick=()=>openVoiceCommand('CHECKIN',{vehicleId:$('ciVehicle').value,driverId:$('ciDriver').value,kilometraje:Number($('ciKm').value||0)});$('btnFailureVoice').onclick=()=>openVoiceCommand('FALLA');$('btnNotificationVoice').onclick=()=>openVoiceCommand('NOTIFICACION');$('voiceRecord').onclick=toggleVoiceRecording;$('voiceClose').onclick=closeVoiceModal;$('voiceCancel').onclick=closeVoiceModal;$('voiceSend').onclick=sendVoiceCommand;
 $('qrClose').onclick=closeCheckinQr;$('qrDone').onclick=closeCheckinQr;$('qrDownload').onclick=downloadCheckinQr;$('qrPrint').onclick=printCheckinQr;
 $('qrModal').addEventListener('click',e=>{if(e.target===$('qrModal'))closeCheckinQr()});
 $('modalClose').onclick=closeModal;$('modalCancel').onclick=closeModal;$('modalSave').onclick=saveModal;
 $('btnExportPdfCurrent').onclick=()=>exportCurrentView('PDF');$('btnExportXlsxCurrent').onclick=()=>exportCurrentView('XLSX');
 $('btnRefresh').onclick=async()=>{const b=$('btnRefresh');loading(b,true);try{await refresh(document.querySelector('#nav button.active')?.dataset.view||'dashboard')}finally{loading(b,false)}};

 $('profileButton').onclick=()=> $('profileMenu').classList.toggle('hidden');
 $('btnChangePhoto').onclick=()=> $('profileFile').click();
 $('profileFile').onchange=()=>uploadProfilePhoto($('profileFile').files[0]);
 $('btnProfileLogout').onclick=()=>logout(true);
 $('btnProfilePhoto').onclick=()=> $('profileFile').click();
 $('btnNewDocument').onclick=()=>openDocumentForm();
 $('btnNewAssignment').onclick=()=>openAssignmentForm();
 $('btnAssignmentLater').onclick=()=> $('assignmentEmergency').classList.add('hidden');
 $('btnAssignmentAccept').onclick=acceptPendingAssignment;

 $('btnNotifications').onclick=openNotifications;$('notificationClose').onclick=closeNotifications;$('notificationRefresh').onclick=()=>loadNotifications(true);$('notificationMarkAll').onclick=markAllNotifications;
 $('btnFuelGps').onclick=()=>captureFuelGps(true);$('btnFuelNearby').onclick=loadNearbyFuelStations;
 $('pageNotificationRefresh').onclick=()=>loadNotifications(true);$('pageNotificationMarkAll').onclick=markAllNotifications;
 $('btnRunPrediction').onclick=runPredictiveAnalysis;
 $('btnSaveCompany').onclick=saveCompanyModule;$('btnCompanyLogo').onclick=()=>$('companyLogoFile').click();$('companyLogoFile').onchange=()=>uploadCompanyLogo($('companyLogoFile').files[0]);
 $('btnCheckinHistoryPdf').onclick=()=>{S.reportRows=filteredCheckinHistory().map(reportNormalizeRow);EFleetExport.toPdf('E-Fleet_Historial_Checkin.pdf','E-Fleet · Historial de Check-in',reportExportRows(),S.company?.nombre||'')};$('btnCheckinHistoryXlsx').onclick=()=>{S.reportRows=filteredCheckinHistory().map(reportNormalizeRow);EFleetExport.toXlsx('E-Fleet_Historial_Checkin.xlsx',reportExportRows(),'Check-in')};
 wireAdvancedFilters();
 $('reportType').onchange=loadReports;$('btnReportRefresh').onclick=loadReports;$('btnReportPdf').onclick=()=>exportCurrentReport('PDF');$('btnReportXlsx').onclick=()=>exportCurrentReport('XLSX');
 $('profileSearch').oninput=renderRoleProfiles;$('profileRoleFilter').onchange=renderRoleProfiles;$('profileFilterClear').onclick=()=>{$('profileSearch').value='';$('profileRoleFilter').value='';renderRoleProfiles()};
 $('permissionClose').onclick=closePermissionModal;$('permissionCancel').onclick=closePermissionModal;$('permissionSave').onclick=saveUserPermissions;$('permissionAll').onclick=()=>setAllPermissions(true);$('permissionNone').onclick=()=>setAllPermissions(false);
 $('permissionMode').onchange=()=>{if($('permissionMode').value==='PERSONALIZADO'&&String(permissionUser?.modo_permisos||'ROL').toUpperCase()!=='PERSONALIZADO')permissionDraft=effectiveMatrixFor(permissionUser);renderPermissionMatrix()};
 $('permissionModal').addEventListener('click',e=>{if(e.target===$('permissionModal'))closePermissionModal()});
  $('nexoFab').onclick=nexoOpen;$('nexoVisibilityToggle').onclick=toggleNexoVisibility;$('nexoClose').onclick=nexoClose;$('nexoSend').onclick=()=>nexoAsk($('nexoInput').value);
 document.querySelectorAll('[data-nexo-q]').forEach(b=>b.onclick=()=>nexoAsk(b.dataset.nexoQ));
 $('nexoInput').addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();nexoAsk($('nexoInput').value)}});
 document.addEventListener('click',e=>{if(!e.target.closest('.profile-wrap'))$('profileMenu')?.classList.add('hidden')});
 window.addEventListener('focus',()=>{if(S.token){loadNotifications(false);flushOfflineCheckins()}});window.addEventListener('online',()=>flushOfflineCheckins());document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'&&S.token)loadNotifications(false)});
 syncNexoVisibility();
 restore();setTimeout(()=>flushOfflineCheckins(),2500);
});
