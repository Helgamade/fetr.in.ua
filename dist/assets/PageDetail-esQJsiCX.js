import{r as b,j as c}from"./vendor-react-CYjnCNCB.js";import{B as _}from"./button-DrNNnXgS.js";import{I as S}from"./input-Bkihkurb.js";import{T as G}from"./textarea-go9NisWJ.js";import{L as C}from"./label-B-XtZYh7.js";import{S as J}from"./switch-De_TMWCr.js";import{C as w,a as E,b as I,d as N}from"./card-ffLtP0a_.js";import{B as P}from"./badge-B3cuwsM6.js";import{c as W,b as Q}from"./usePages-BJ90f0i8.js";import{b as X,A as Y,q as Z,z as ee,at as M}from"./index-DgJR60DP.js";import{p as n}from"./index-IDfmEXzr.js";import{A as ne}from"./arrow-left-BLbkv8RI.js";import{E as te}from"./eye-C4mwoI-9.js";import{E as re}from"./eye-off-CC1rakxb.js";import{S as ie}from"./save-BQ9vPo6g.js";import"./index-CF2Cz9Hv.js";var D=function(){return D=Object.assign||function(t){for(var r,i=1,s=arguments.length;i<s;i++){r=arguments[i];for(var a in r)Object.prototype.hasOwnProperty.call(r,a)&&(t[a]=r[a])}return t},D.apply(this,arguments)},V={onActivate:n.func,onAddUndo:n.func,onBeforeAddUndo:n.func,onBeforeExecCommand:n.func,onBeforeGetContent:n.func,onBeforeRenderUI:n.func,onBeforeSetContent:n.func,onBeforePaste:n.func,onBlur:n.func,onChange:n.func,onClearUndos:n.func,onClick:n.func,onContextMenu:n.func,onCommentChange:n.func,onCompositionEnd:n.func,onCompositionStart:n.func,onCompositionUpdate:n.func,onCopy:n.func,onCut:n.func,onDblclick:n.func,onDeactivate:n.func,onDirty:n.func,onDrag:n.func,onDragDrop:n.func,onDragEnd:n.func,onDragGesture:n.func,onDragOver:n.func,onDrop:n.func,onExecCommand:n.func,onFocus:n.func,onFocusIn:n.func,onFocusOut:n.func,onGetContent:n.func,onHide:n.func,onInit:n.func,onInput:n.func,onKeyDown:n.func,onKeyPress:n.func,onKeyUp:n.func,onLoadContent:n.func,onMouseDown:n.func,onMouseEnter:n.func,onMouseLeave:n.func,onMouseMove:n.func,onMouseOut:n.func,onMouseOver:n.func,onMouseUp:n.func,onNodeChange:n.func,onObjectResizeStart:n.func,onObjectResized:n.func,onObjectSelected:n.func,onPaste:n.func,onPostProcess:n.func,onPostRender:n.func,onPreProcess:n.func,onProgressState:n.func,onRedo:n.func,onRemove:n.func,onReset:n.func,onSaveContent:n.func,onSelectionChange:n.func,onSetAttrib:n.func,onSetContent:n.func,onShow:n.func,onSubmit:n.func,onUndo:n.func,onVisualAid:n.func,onSkinLoadError:n.func,onThemeLoadError:n.func,onModelLoadError:n.func,onPluginLoadError:n.func,onIconsLoadError:n.func,onLanguageLoadError:n.func,onScriptsLoad:n.func,onScriptsLoadError:n.func},oe=D({apiKey:n.string,licenseKey:n.string,id:n.string,inline:n.bool,init:n.object,initialValue:n.string,onEditorChange:n.func,value:n.string,tagName:n.string,tabIndex:n.number,cloudChannel:n.string,plugins:n.oneOfType([n.string,n.array]),toolbar:n.oneOfType([n.string,n.array]),disabled:n.bool,readonly:n.bool,textareaName:n.string,tinymceScriptSrc:n.oneOfType([n.string,n.arrayOf(n.string),n.arrayOf(n.shape({src:n.string,async:n.bool,defer:n.bool}))]),rollback:n.oneOfType([n.number,n.oneOf([!1])]),scriptLoading:n.shape({async:n.bool,defer:n.bool,delay:n.number})},V),q=function(t){var r=t;return r&&r.tinymce?r.tinymce:null},L=function(t){return typeof t=="function"},R=function(t){return t in V},A=function(t){return t.substr(2)},ae=function(t,r,i,s,a,o,e){var l=Object.keys(a).filter(R),u=Object.keys(o).filter(R),f=l.filter(function(d){return o[d]===void 0}),m=u.filter(function(d){return a[d]===void 0});f.forEach(function(d){var h=A(d),y=e[h];i(h,y),delete e[h]}),m.forEach(function(d){var h=s(t,d),y=A(d);e[y]=h,r(y,h)})},se=function(t,r,i,s,a){return ae(a,t.on.bind(t),t.off.bind(t),function(o,e){return function(l){var u;return(u=o(e))===null||u===void 0?void 0:u(l,t)}},r,i,s)},z=0,$=function(t){var r=Date.now(),i=Math.floor(Math.random()*1e9);return z++,t+"_"+i+z+String(r)},F=function(t){return t!==null&&(t.tagName.toLowerCase()==="textarea"||t.tagName.toLowerCase()==="input")},H=function(t){return typeof t>"u"||t===""?[]:Array.isArray(t)?t:t.split(" ")},le=function(t,r){return H(t).concat(H(r))},ce=function(){return window.InputEvent&&typeof InputEvent.prototype.getTargetRanges=="function"},de=function(t){if(!("isConnected"in Node.prototype)){for(var r=t,i=t.parentNode;i!=null;)r=i,i=r.parentNode;return r===t.ownerDocument}return t.isConnected},K=function(t,r){t!==void 0&&(t.mode!=null&&typeof t.mode=="object"&&typeof t.mode.set=="function"?t.mode.set(r):t.setMode(r))},ue=function(t){var r=q(t);if(!r)throw new Error("tinymce should have been loaded into global scope");return r},U=function(t){return t.options&&t.options.isRegistered("disabled")},T=function(){return T=Object.assign||function(t){for(var r,i=1,s=arguments.length;i<s;i++){r=arguments[i];for(var a in r)Object.prototype.hasOwnProperty.call(r,a)&&(t[a]=r[a])}return t},T.apply(this,arguments)},fe=function(t,r,i){var s,a,o=t.createElement("script");o.referrerPolicy="origin",o.type="application/javascript",o.id=r.id,o.src=r.src,o.async=(s=r.async)!==null&&s!==void 0?s:!1,o.defer=(a=r.defer)!==null&&a!==void 0?a:!1;var e=function(){o.removeEventListener("load",e),o.removeEventListener("error",l),i(r.src)},l=function(u){o.removeEventListener("load",e),o.removeEventListener("error",l),i(r.src,u)};o.addEventListener("load",e),o.addEventListener("error",l),t.head&&t.head.appendChild(o)},pe=function(t){var r={},i=function(e,l){var u=r[e];u.done=!0,u.error=l;for(var f=0,m=u.handlers;f<m.length;f++){var d=m[f];d(e,l)}u.handlers=[]},s=function(e,l,u){var f=function(j){return u!==void 0?u(j):console.error(j)};if(e.length===0){f(new Error("At least one script must be provided"));return}for(var m=0,d=!1,h=function(j,B){d||(B?(d=!0,f(B)):++m===e.length&&l())},y=0,g=e;y<g.length;y++){var p=g[y],v=r[p.src];if(v)v.done?h(p.src,v.error):v.handlers.push(h);else{var k=$("tiny-");r[p.src]={id:k,src:p.src,done:!1,error:null,handlers:[h]},fe(t,T({id:k},p),i)}}},a=function(){for(var e,l=0,u=Object.values(r);l<u.length;l++){var f=u[l],m=t.getElementById(f.id);m!=null&&m.tagName==="SCRIPT"&&((e=m.parentNode)===null||e===void 0||e.removeChild(m))}r={}},o=function(){return t};return{loadScripts:s,deleteScripts:a,getDocument:o}},he=function(){var t=[],r=function(a){var o=t.find(function(e){return e.getDocument()===a});return o===void 0&&(o=pe(a),t.push(o)),o},i=function(a,o,e,l,u){var f=function(){return r(a).loadScripts(o,l,u)};e>0?setTimeout(f,e):f()},s=function(){for(var a=t.pop();a!=null;a=t.pop())a.deleteScripts()};return{loadList:i,reinitialize:s}},me=he(),ve=function(){var t=function(r,i){return t=Object.setPrototypeOf||{__proto__:[]}instanceof Array&&function(s,a){s.__proto__=a}||function(s,a){for(var o in a)Object.prototype.hasOwnProperty.call(a,o)&&(s[o]=a[o])},t(r,i)};return function(r,i){if(typeof i!="function"&&i!==null)throw new TypeError("Class extends value "+String(i)+" is not a constructor or null");t(r,i);function s(){this.constructor=r}r.prototype=i===null?Object.create(i):(s.prototype=i.prototype,new s)}}(),x=function(){return x=Object.assign||function(t){for(var r,i=1,s=arguments.length;i<s;i++){r=arguments[i];for(var a in r)Object.prototype.hasOwnProperty.call(r,a)&&(t[a]=r[a])}return t},x.apply(this,arguments)},O="change keyup compositionend setcontent CommentChange",ge=function(t){ve(r,t);function r(i){var s,a,o,e=t.call(this,i)||this;return e.rollbackTimer=void 0,e.valueCursor=void 0,e.rollbackChange=function(){var l=e.editor,u=e.props.value;l&&u&&u!==e.currentContent&&l.undoManager.ignore(function(){if(l.setContent(u),e.valueCursor&&(!e.inline||l.hasFocus()))try{l.selection.moveToBookmark(e.valueCursor)}catch{}}),e.rollbackTimer=void 0},e.handleBeforeInput=function(l){if(e.props.value!==void 0&&e.props.value===e.currentContent&&e.editor&&(!e.inline||e.editor.hasFocus()))try{e.valueCursor=e.editor.selection.getBookmark(3)}catch{}},e.handleBeforeInputSpecial=function(l){(l.key==="Enter"||l.key==="Backspace"||l.key==="Delete")&&e.handleBeforeInput(l)},e.handleEditorChange=function(l){var u=e.editor;if(u&&u.initialized){var f=u.getContent();e.props.value!==void 0&&e.props.value!==f&&e.props.rollback!==!1&&(e.rollbackTimer||(e.rollbackTimer=window.setTimeout(e.rollbackChange,typeof e.props.rollback=="number"?e.props.rollback:200))),f!==e.currentContent&&(e.currentContent=f,L(e.props.onEditorChange)&&e.props.onEditorChange(f,u))}},e.handleEditorChangeSpecial=function(l){(l.key==="Backspace"||l.key==="Delete")&&e.handleEditorChange(l)},e.initialise=function(l){var u,f,m;l===void 0&&(l=0);var d=e.elementRef.current;if(d){if(!de(d)){if(l===0)setTimeout(function(){return e.initialise(1)},1);else if(l<100)setTimeout(function(){return e.initialise(l+1)},100);else throw new Error("tinymce can only be initialised when in a document");return}var h=ue(e.view),y=x(x(x(x({},e.props.init),{selector:void 0,target:d,disabled:e.props.disabled,readonly:e.props.readonly,inline:e.inline,plugins:le((u=e.props.init)===null||u===void 0?void 0:u.plugins,e.props.plugins),toolbar:(f=e.props.toolbar)!==null&&f!==void 0?f:(m=e.props.init)===null||m===void 0?void 0:m.toolbar}),e.props.licenseKey?{license_key:e.props.licenseKey}:{}),{setup:function(g){e.editor=g,e.bindHandlers({}),e.inline&&!F(d)&&g.once("PostRender",function(p){g.setContent(e.getInitialValue(),{no_events:!0})}),e.props.init&&L(e.props.init.setup)&&e.props.init.setup(g),e.props.disabled&&(U(e.editor)?e.editor.options.set("disabled",e.props.disabled):e.editor.mode.set("readonly"))},init_instance_callback:function(g){var p,v=e.getInitialValue();e.currentContent=(p=e.currentContent)!==null&&p!==void 0?p:g.getContent(),e.currentContent!==v&&(e.currentContent=v,g.setContent(v),g.undoManager.clear(),g.undoManager.add(),g.setDirty(!1)),e.props.init&&L(e.props.init.init_instance_callback)&&e.props.init.init_instance_callback(g)}});e.inline||(d.style.visibility=""),F(d)&&(d.value=e.getInitialValue()),h.init(y)}},e.id=e.props.id||$("tiny-react"),e.elementRef=b.createRef(),e.inline=(o=(s=e.props.inline)!==null&&s!==void 0?s:(a=e.props.init)===null||a===void 0?void 0:a.inline)!==null&&o!==void 0?o:!1,e.boundHandlers={},e}return Object.defineProperty(r.prototype,"view",{get:function(){var i,s;return(s=(i=this.elementRef.current)===null||i===void 0?void 0:i.ownerDocument.defaultView)!==null&&s!==void 0?s:window},enumerable:!1,configurable:!0}),r.prototype.componentDidUpdate=function(i){var s=this,a,o;if(this.rollbackTimer&&(clearTimeout(this.rollbackTimer),this.rollbackTimer=void 0),this.editor&&(this.bindHandlers(i),this.editor.initialized)){if(this.currentContent=(a=this.currentContent)!==null&&a!==void 0?a:this.editor.getContent(),typeof this.props.initialValue=="string"&&this.props.initialValue!==i.initialValue)this.editor.setContent(this.props.initialValue),this.editor.undoManager.clear(),this.editor.undoManager.add(),this.editor.setDirty(!1);else if(typeof this.props.value=="string"&&this.props.value!==this.currentContent){var e=this.editor;e.undoManager.transact(function(){var u;if(!s.inline||e.hasFocus())try{u=e.selection.getBookmark(3)}catch{}var f=s.valueCursor;if(e.setContent(s.props.value),!s.inline||e.hasFocus())for(var m=0,d=[u,f];m<d.length;m++){var h=d[m];if(h)try{e.selection.moveToBookmark(h),s.valueCursor=h;break}catch{}}})}if(this.props.readonly!==i.readonly){var l=(o=this.props.readonly)!==null&&o!==void 0?o:!1;K(this.editor,l?"readonly":"design")}this.props.disabled!==i.disabled&&(U(this.editor)?this.editor.options.set("disabled",this.props.disabled):K(this.editor,this.props.disabled?"readonly":"design"))}},r.prototype.componentDidMount=function(){var i=this,s,a,o,e,l;if(q(this.view)!==null)this.initialise();else if(Array.isArray(this.props.tinymceScriptSrc)&&this.props.tinymceScriptSrc.length===0)(a=(s=this.props).onScriptsLoadError)===null||a===void 0||a.call(s,new Error("No `tinymce` global is present but the `tinymceScriptSrc` prop was an empty array."));else if(!((o=this.elementRef.current)===null||o===void 0)&&o.ownerDocument){var u=function(){var m,d;(d=(m=i.props).onScriptsLoad)===null||d===void 0||d.call(m),i.initialise()},f=function(m){var d,h;(h=(d=i.props).onScriptsLoadError)===null||h===void 0||h.call(d,m)};me.loadList(this.elementRef.current.ownerDocument,this.getScriptSources(),(l=(e=this.props.scriptLoading)===null||e===void 0?void 0:e.delay)!==null&&l!==void 0?l:0,u,f)}},r.prototype.componentWillUnmount=function(){var i=this,s=this.editor;s&&(s.off(O,this.handleEditorChange),s.off(this.beforeInputEvent(),this.handleBeforeInput),s.off("keypress",this.handleEditorChangeSpecial),s.off("keydown",this.handleBeforeInputSpecial),s.off("NewBlock",this.handleEditorChange),Object.keys(this.boundHandlers).forEach(function(a){s.off(a,i.boundHandlers[a])}),this.boundHandlers={},s.remove(),this.editor=void 0)},r.prototype.render=function(){return this.inline?this.renderInline():this.renderIframe()},r.prototype.beforeInputEvent=function(){return ce()?"beforeinput SelectionChange":"SelectionChange"},r.prototype.renderInline=function(){var i=this.props.tagName,s=i===void 0?"div":i;return b.createElement(s,{ref:this.elementRef,id:this.id,tabIndex:this.props.tabIndex})},r.prototype.renderIframe=function(){return b.createElement("textarea",{ref:this.elementRef,style:{visibility:"hidden"},name:this.props.textareaName,id:this.id,tabIndex:this.props.tabIndex})},r.prototype.getScriptSources=function(){var i,s,a=(i=this.props.scriptLoading)===null||i===void 0?void 0:i.async,o=(s=this.props.scriptLoading)===null||s===void 0?void 0:s.defer;if(this.props.tinymceScriptSrc!==void 0)return typeof this.props.tinymceScriptSrc=="string"?[{src:this.props.tinymceScriptSrc,async:a,defer:o}]:this.props.tinymceScriptSrc.map(function(f){return typeof f=="string"?{src:f,async:a,defer:o}:f});var e=this.props.cloudChannel,l=this.props.apiKey?this.props.apiKey:"no-api-key",u="https://cdn.tiny.cloud/1/".concat(l,"/tinymce/").concat(e,"/tinymce.min.js");return[{src:u,async:a,defer:o}]},r.prototype.getInitialValue=function(){return typeof this.props.initialValue=="string"?this.props.initialValue:typeof this.props.value=="string"?this.props.value:""},r.prototype.bindHandlers=function(i){var s=this;if(this.editor!==void 0){se(this.editor,i,this.props,this.boundHandlers,function(l){return s.props[l]});var a=function(l){return l.onEditorChange!==void 0||l.value!==void 0},o=a(i),e=a(this.props);!o&&e?(this.editor.on(O,this.handleEditorChange),this.editor.on(this.beforeInputEvent(),this.handleBeforeInput),this.editor.on("keydown",this.handleBeforeInputSpecial),this.editor.on("keyup",this.handleEditorChangeSpecial),this.editor.on("NewBlock",this.handleEditorChange)):o&&!e&&(this.editor.off(O,this.handleEditorChange),this.editor.off(this.beforeInputEvent(),this.handleBeforeInput),this.editor.off("keydown",this.handleBeforeInputSpecial),this.editor.off("keyup",this.handleEditorChangeSpecial),this.editor.off("NewBlock",this.handleEditorChange))}},r.propTypes=oe,r.defaultProps={cloudChannel:"8"},r}(b.Component);function ye({content:t,onChange:r,placeholder:i="Введіть текст...",className:s}){const a=b.useRef(null);return c.jsx("div",{className:X("border rounded-lg overflow-hidden",s),children:c.jsx(ge,{apiKey:"5d1p6abbg6cfswxaikso0fiwwlpcvppyeqv09wld5lk9w4sx",onInit:(o,e)=>{a.current=e},value:t,onEditorChange:o=>{r(o)},init:{height:700,menubar:!1,placeholder:i,plugins:["advlist","autolink","lists","link","image","charmap","preview","anchor","searchreplace","visualblocks","code","fullscreen","insertdatetime","media","table","help","wordcount","emoticons","codesample","nonbreaking","pagebreak","save","visualchars","accordion"],toolbar:["undo redo | blocks | styles | bold italic | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | blockquote","link image media | charmap emoticons | insertdatetime | anchor | table | codesample | visualblocks visualchars | searchreplace | nonbreaking pagebreak | save accordion | removeformat | code | preview | fullscreen | help"],style_formats:[{title:"Текст без обгортки",inline:"span",remove:"p",styles:{display:"inline"}},{title:"Цитата",block:"blockquote",wrapper:!0,classes:"quote-style"},{title:"Блок з відступом",block:"div",classes:"indent-block",wrapper:!0},{title:"Блок з фоном",block:"div",classes:"highlight-block",wrapper:!0},{title:"Блок з рамкою",block:"div",classes:"bordered-block",wrapper:!0}],style_formats_merge:!1,content_style:`
            body { 
              font-family: Nunito, sans-serif; 
              font-size: 18px; 
              line-height: 1.6;
              color: hsl(var(--foreground));
              background: hsl(var(--background));
            }
            h1 {
              font-family: Montserrat, sans-serif;
              font-size: 36px;
              font-weight: 700;
              margin-top: 2rem;
              margin-bottom: 1.5rem;
            }
            h2 {
              font-family: Montserrat, sans-serif;
              font-size: 24px;
              font-weight: 600;
              margin-top: 2rem;
              margin-bottom: 1rem;
            }
            h3 {
              font-family: Montserrat, sans-serif;
              font-size: 16px;
              font-weight: 700;
              margin-top: 1.5rem;
              margin-bottom: 0.75rem;
            }
            h4 {
              font-family: Montserrat, sans-serif;
              font-size: 14px;
              font-weight: 700;
              margin-top: 1rem;
              margin-bottom: 0.5rem;
            }
            h5 {
              font-family: Montserrat, sans-serif;
              font-size: 13px;
              font-weight: 700;
              margin-top: 1rem;
              margin-bottom: 0.5rem;
            }
            h6 {
              font-family: Montserrat, sans-serif;
              font-size: 12px;
              font-weight: 700;
              margin-top: 0.75rem;
              margin-bottom: 0.5rem;
            }
            p {
              margin-top: 0;
              margin-bottom: 1rem;
            }
            ul, ol {
              margin-top: 1rem;
              margin-bottom: 1rem;
              padding-left: 1.5rem;
            }
            li {
              margin-top: 0.5rem;
              margin-bottom: 0.5rem;
            }
            ul ul, ol ol, ul ol, ol ul {
              margin-top: 0.5rem;
              margin-bottom: 0.5rem;
              padding-left: 1.5rem;
            }
            ul ul {
              list-style-type: circle;
            }
            ul ul ul {
              list-style-type: square;
            }
            ol ol {
              list-style-type: lower-alpha;
            }
            ol ol ol {
              list-style-type: lower-roman;
            }
            blockquote {
              margin-top: 1.5rem;
              margin-bottom: 1.5rem;
              padding: 1rem;
              padding-left: 1.5rem;
              border-left: 4px solid #f97316;
              background: rgba(245, 245, 245, 0.5);
              font-style: italic;
            }
            .indent-block {
              margin-top: 1rem;
              margin-bottom: 1rem;
              padding-left: 2rem;
              padding-right: 1rem;
              border-left: 2px solid #e5e7eb;
              display: block;
            }
            .highlight-block {
              margin-top: 1rem;
              margin-bottom: 1rem;
              padding: 1rem;
              background: rgba(245, 245, 245, 0.8);
              border-radius: 0.5rem;
              display: block;
            }
            .bordered-block {
              margin-top: 1rem;
              margin-bottom: 1rem;
              padding: 1rem;
              border: 1px solid #e5e7eb;
              border-radius: 0.5rem;
              background: #ffffff;
              display: block;
            }
            hr {
              margin-top: 2rem;
              margin-bottom: 2rem;
              border-top: 1px solid hsl(var(--border));
            }
            pre {
              margin-top: 1.5rem;
              margin-bottom: 1.5rem;
              padding: 1rem;
              background: hsl(var(--muted));
              border-radius: 0.5rem;
              overflow-x: auto;
            }
            a {
              color: hsl(var(--primary));
              text-decoration: none;
            }
            a:hover {
              text-decoration: underline;
            }
          `,skin:"oxide",content_css:!1}})})}function Pe(){const{id:t}=Y(),r=Z(),{toast:i}=ee(),s=W(),a=Q(),[o,e]=b.useState(null),[l,u]=b.useState(!0),[f,m]=b.useState(!1),[d,h]=b.useState({slug:"",title:"",content:"",meta_title:"",meta_description:"",is_published:!0});b.useEffect(()=>{t&&(t==="new"?(e(null),h({slug:"",title:"",content:"",meta_title:"",meta_description:"",is_published:!0}),u(!1)):M.getAll().then(p=>{const v=p.find(k=>k.id===parseInt(t));v?(e(v),h({slug:v.slug,title:v.title,content:v.content,meta_title:v.meta_title||"",meta_description:v.meta_description||"",is_published:v.is_published})):(i({title:"Помилка",description:"Сторінку не знайдено",variant:"destructive"}),r("/admin/pages"))}).catch(p=>{i({title:"Помилка",description:p.message||"Не вдалося завантажити сторінку",variant:"destructive"}),r("/admin/pages")}).finally(()=>u(!1)))},[t,r,i]);const y=async()=>{if(!d.slug||!d.title||!d.content){i({title:"Помилка",description:"Заповніть всі обов'язкові поля",variant:"destructive"});return}m(!0);try{if(t==="new"){const p=await M.create(d);i({title:"Створено",description:"Сторінку успішно створено"}),r(`/admin/pages/${p.id}`)}else o&&(await s.mutateAsync({id:o.id,...d}),i({title:"Збережено",description:"Сторінку успішно оновлено"}),e({...o,...d}))}catch(p){i({title:"Помилка",description:p.message||"Не вдалося зберегти сторінку",variant:"destructive"})}finally{m(!1)}},g=async()=>{if(!(!o||!confirm(`Ви впевнені, що хочете видалити сторінку "${o.title}"?`)))try{await a.mutateAsync(o.id),i({title:"Видалено",description:"Сторінку успішно видалено"}),r("/admin/pages")}catch(p){i({title:"Помилка",description:p.message||"Не вдалося видалити сторінку",variant:"destructive"})}};return l?c.jsx("div",{className:"flex items-center justify-center py-12",children:c.jsx("div",{className:"text-muted-foreground",children:"Завантаження сторінки..."})}):c.jsxs("div",{className:"space-y-6",children:[c.jsxs("div",{className:"flex items-center justify-between",children:[c.jsxs("div",{className:"flex items-center gap-4",children:[c.jsx(_,{variant:"ghost",size:"icon",onClick:()=>r("/admin/pages"),children:c.jsx(ne,{className:"h-4 w-4"})}),c.jsxs("div",{children:[c.jsx("h1",{className:"text-2xl font-bold",children:t==="new"?"Створити нову сторінку":`Редагувати: ${(o==null?void 0:o.title)||""}`}),o&&c.jsxs("p",{className:"text-sm text-muted-foreground mt-1",children:["URL: ",c.jsxs("code",{className:"bg-muted px-1 py-0.5 rounded",children:["/",o.slug]})]})]})]}),c.jsxs("div",{className:"flex items-center gap-2",children:[o&&c.jsxs(c.Fragment,{children:[o.is_published?c.jsxs(P,{variant:"default",className:"bg-green-100 text-green-800",children:[c.jsx(te,{className:"h-3 w-3 mr-1"}),"Опубліковано"]}):c.jsxs(P,{variant:"secondary",children:[c.jsx(re,{className:"h-3 w-3 mr-1"}),"Чернетка"]}),c.jsx(_,{variant:"destructive",onClick:g,disabled:a.isPending,children:"Видалити"})]}),c.jsxs(_,{onClick:y,disabled:f||s.isPending,children:[c.jsx(ie,{className:"h-4 w-4 mr-2"}),"Зберегти"]})]})]}),c.jsxs("div",{className:"grid gap-6",children:[c.jsxs(w,{children:[c.jsx(E,{children:c.jsx(I,{children:"Основна інформація"})}),c.jsxs(N,{className:"space-y-4",children:[c.jsxs("div",{className:"space-y-2",children:[c.jsx(C,{htmlFor:"slug",children:"URL (slug) *"}),c.jsx(S,{id:"slug",value:d.slug,onChange:p=>h({...d,slug:p.target.value}),placeholder:"polityka-konfidentsiynosti"}),c.jsx("p",{className:"text-xs text-muted-foreground",children:"Використовуйте тільки латинські літери, цифри та дефіси"})]}),c.jsxs("div",{className:"space-y-2",children:[c.jsx(C,{htmlFor:"title",children:"Назва сторінки *"}),c.jsx(S,{id:"title",value:d.title,onChange:p=>h({...d,title:p.target.value}),placeholder:"Політика конфіденційності"})]}),c.jsxs("div",{className:"flex items-center space-x-2",children:[c.jsx(J,{id:"published",checked:d.is_published,onCheckedChange:p=>h({...d,is_published:p})}),c.jsx(C,{htmlFor:"published",children:"Опубліковано"})]})]})]}),c.jsxs(w,{children:[c.jsx(E,{children:c.jsx(I,{children:"SEO налаштування"})}),c.jsxs(N,{className:"space-y-4",children:[c.jsxs("div",{className:"space-y-2",children:[c.jsx(C,{htmlFor:"meta-title",children:"Meta Title (SEO)"}),c.jsx(S,{id:"meta-title",value:d.meta_title,onChange:p=>h({...d,meta_title:p.target.value}),placeholder:"Політика конфіденційності - FetrInUA"})]}),c.jsxs("div",{className:"space-y-2",children:[c.jsx(C,{htmlFor:"meta-description",children:"Meta Description (SEO)"}),c.jsx(G,{id:"meta-description",value:d.meta_description,onChange:p=>h({...d,meta_description:p.target.value}),placeholder:"Опис сторінки для пошукових систем",rows:3})]})]})]}),c.jsxs(w,{children:[c.jsx(E,{children:c.jsx(I,{children:"Зміст сторінки *"})}),c.jsx(N,{children:c.jsx(ye,{content:d.content,onChange:p=>h({...d,content:p}),placeholder:"Введіть текст сторінки..."})})]})]})]})}export{Pe as PageDetail};
