import{c as o}from"./index-Du5PH0RG.js";/**
 * @license lucide-react v0.562.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const u=[["path",{d:"M22 17a2 2 0 0 1-2 2H6.828a2 2 0 0 0-1.414.586l-2.202 2.202A.71.71 0 0 1 2 21.286V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2z",key:"18887p"}],["path",{d:"M12 8v6",key:"1ib9pf"}],["path",{d:"M9 11h6",key:"1fldmi"}]],g=o("message-square-plus",u);/**
 * @license lucide-react v0.562.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const c=[["path",{d:"M16 3a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2 1 1 0 0 1 1 1v1a2 2 0 0 1-2 2 1 1 0 0 0-1 1v2a1 1 0 0 0 1 1 6 6 0 0 0 6-6V5a2 2 0 0 0-2-2z",key:"rib7q0"}],["path",{d:"M5 3a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2 1 1 0 0 1 1 1v1a2 2 0 0 1-2 2 1 1 0 0 0-1 1v2a1 1 0 0 0 1 1 6 6 0 0 0 6-6V5a2 2 0 0 0-2-2z",key:"1ymkrd"}]],d=o("quote",c);function m(e,t=1e3){if(typeof e!="string")return"";let r=e.replace(/\0/g,"");return r=r.replace(/<[^>]*>/g,""),r=r.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,""),r=r.replace(/javascript:/gi,""),r=r.replace(/data:/gi,""),r=r.trim(),r.length>t&&(r=r.substring(0,t)),r}function v(e){if(typeof e!="string")return"";let t=e.replace(/[^a-zA-Zа-яА-ЯіІїЇєЄґҐ\s'-]/g,"");return t=t.replace(/\s+/g," "),t=t.trim(),t.length>100&&(t=t.substring(0,100)),t}function M(e){if(e==null)return null;const t=typeof e=="number"?e:parseInt(String(e),10);return isNaN(t)||t<1||t>5?null:t}function h(e){const t=new Date,r=typeof e=="string"?new Date(e):e,f=t.getTime()-r.getTime(),n=Math.floor(f/(1e3*60*60*24));if(n<1){const i=Math.floor(f/36e5);if(i<1){const a=Math.floor(f/6e4);return a<1?"щойно":a===1?"1 хвилину тому":a<5?`${a} хвилини тому`:`${a} хвилин тому`}return i===1?"1 годину тому":i<5?`${i} години тому`:`${i} годин тому`}if(n===1)return"вчора";if(n<7)return`${n} ${l(n)} тому`;const s=Math.floor(n/7);return s===1?"1 тиждень тому":s<5?`${s} тижні тому`:`${s} тижнів тому`}function l(e){return e===1?"день":e>=2&&e<=4?"дні":"днів"}export{g as M,d as Q,m as a,h as f,v as s,M as v};
