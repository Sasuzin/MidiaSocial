let UserLogado = localStorage.getItem('user');
if(!UserLogado) {
    location.href= 'form.html';
}

let midia = document.getElementById('midia');
let btnImg = document.getElementById('btnImg');
let btnVideo = document.getElementById('btnVideo');
let arquivoImg = document.getElementById("btnImg").files[0];
let arquivoVideo = document.getElementById("btnVideo").files[0];

function adcCoisas(file, type) {

    var reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = function () {
        console.log(arquivoImg);
        //console.log(arquivoVideo);

        if(type == "img"){
            midia.innerHTML = ` <img src="${reader.result}" id = "postMidia" style="width:300px; height:300px;" >`; console.log('passou inerrHtml');
            
        } else if (btnVideo.value.trim() > 0){
            midia.innerHTML = `<video src="${reader.result}" id = "postMidia" style="width:500px; height:500px;"> </video>`; console.log('passou inerrHtml');
        }
      }
     
    }
  


btnImg.onchange = function(){
    console.log('entrando no adicionar coisas');
    adcCoisas(arquivoImg, "img");
    console.log('saindo');
} 

btnVideo.onchange = function(){
    adcCoisas(arquivoVideo);
} 





/* document.addEventListener('DOMContentLoaded',()=>{

    const pincel ={
        ativo: false,
        movendo: false,
        pos:{x:0,y:0},
        posAnterior: null
    }

    const tela = document.querySelector('#tela');
    const contexto = tela.getContext('2d')

    tela.width = 700;
    tela.height = 500;

    contexto.lineWidth = 7;
    contexto.strokeStyle = "purple"
    

    const desenharLinha = (linha) => {

        contexto.beginPath();
        contexto.moveTo(linha.posAnterior.x, linha.posAnterior.y);
        contexto.lineTo(linha.pos.x, linha.pos.y)
        contexto.stroke();
        }

        tela.onmousedown = (evento)=>{ pincel.ativo = true};
        tela.onmouseup = (evento)=>{ pincel.ativo = false};

        tela.onmousemove = (evento) => {
            pincel.pos.x = evento.clientX
            pincel.pos.y = evento.clientY
            pincel.movendo = true;
        }

        const ciclo = ()=>{
            if(pincel.ativo && pincel.movendo && pincel.posAnterior) {
                desenharLinha({pos: pincel.pos, posAnterior: pincel.posAnterior})
                pincel.movendo = false;
            }
            pincel.posAnterior = {x: pincel.pos.x, y: pincel.pos.y}

            setTimeout(ciclo, 10);
        }
        ciclo()

    //desenharLinha({pos:{x: 350,y: 250},posAnterior:{x: 10,y: 10}})
})
*/ 
