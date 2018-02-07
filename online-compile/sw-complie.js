// key转换
var keyMap={dn:"display: none",di:"display: inline",dib:"display: inline-block",db:"display: block",dt:"display: table",dtc:"display: table-cell",m:"margin: ",ml:"margin-left: ",mt:"margin-top: ",mr:"margin-right: ",mb:"margin-bottom: ",ma:"margin: auto",mla:"margin-left: auto",mra:"margin-right: auto",p:"padding: ",pl:"padding-left: ",pt:"padding-top: ",pr:"padding-right: ",pb:"padding-bottom: ",l:"float: left",r:"float: right",bg:"background: ",bgc:"background-color: ",bgi:"background-image: ",bgr:"background-repeat: ",bgp:"background-position: ",c:"color: ",bd:"border: ",bdl:"border-left: ",bdr:"border-right: ",bdt:"border-top: ",bdb:"border-bottom: ",br:"border-radius: ",bbb:"box-sizing: border-box",o:"outline: ",f:"font-size: ",ff:"font-family: ",fs:"font-style: ",fw:"font-weight: ",b:"font-weight: bold",i:"font-style: italic",n:"font-weight: normal; font-style: normal",tdl:"text-decoration: underline",tdn:"text-decoration: none",tc:"text-align: center",tl:"text-align: left",tr:"text-align: right",tj:"text-align: justify",cl:"clear: both",abs:"position: absolute",rel:"position: relative",fix:"position: fixed",op:"opacity: ",z:"zoom: ",zx:"z-index: ",h:"height: ",w:"width: ",lh:"line-height: ",v:"vertical-align: ",vt:"vertical-align: top",vm:"vertical-align: middle",vb:"vertical-align: bottom",poi:"cursor: pointer",def:"cursor: default",ovh:"overflow: hidden",ova:"overflow: auto",vh:"visibility: hidden",vv:"visibility: visible",prew:"white-space: pre-wrap",pre:"white-space: pre",nowrap:"white-space: nowrap",bk:"word-break: break-all",bkw:"word-wrap: break-word",ws:"word-spacing: ",ls:"letter-spacing: ",a:"animation: ",tsf:"transform: ",tsl:"transition: ",bs:"box-shadow: ",ts:"text-shadow: ",center:"position: absolute; top: 0; bottom: 0; right: 0; left: 0; margin: auto",ell:"text-overflow: ellipsis; white-space: nowrap; overflow: hidden",clip:"position: absolute; clip: rect(0 0 0 0)"};var valueMap={s:"solid",d:"dashed",tt:"transparent",cc:"currentColor",n:"normal",c:"center",rx:"repeat-x",ry:"repeat-y",no:"no-repeat",ih:"inherit",l:"left",t:"top",r:"right",b:"bottom"};function qcss(b){var c={};b.replace(/\/\*([\w\W]*?)\*\//,function(e,d){d.split(";").forEach(function(h){var g=h.split("$")[1];if(g&&g.split("=").length==2){var f=g.split("=");if(f[1].trim()&&f[0].trim()){c[f[0].trim()]=f[1].trim()}}})});var a=b.replace(/\{([\w\W]*?)\}/g,function(h,d){var f="    ";var e="{\n"+f,g="\n}";if(/\{/.test(d)){g="\n"+f+"}";f=f+f;e="{"+d.split("{")[0]+"{\n"+f;d=d.split("{")[1]}return e+d.split(";").map(function(i){i=i.trim();if(!i){return""}if(i.indexOf(":")!=-1){return i}return i.replace(/^([a-z]+)(.*)$/g,function(l,j,k){k=(k||"").split(" ").map(function(m){m=m.trim();if(!m){return""}if(!isNaN(m)){if(j=="lh"&&m<5){return m}else{if(/^(?:zx|op|z|fw)$/.test(j)==false&&m!="0"){m=m+"px"}}}else{if(j=="tsl"){m=(keyMap[m]||m).replace(":","").trim()}else{if(j!="a"){m=c[m]||valueMap[m]||m}}}return m}).join(" ");j=keyMap[j]||j+": ";return j+k.trim()})}).join(";\n"+f).trim()+g}).replace(/\w\{/g,function(d){return d.replace("{"," {")}).replace(/\}(\.|#|\:|\[|\w)/g,function(d){return d.replace("}","}\n")});return a};

self.addEventListener('fetch', function(event) {
  event.respondWith(async function () {
    var body = '';
    if (/\.qcss/.test(event.request.url)) {
      let res = await fetch(event.request);
      let text = await res.text();
      body = await qcss(text);

      return new Response(body, {
        headers: {
          'content-type': 'text/css; charset=utf-8' 
        }
      });
    } else {
      return fetch(event.request);
    }    
  }());
});