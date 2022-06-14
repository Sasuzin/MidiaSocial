 class FormPost{

    constructor(idForm, idTextarea, idUlPost, idPostImage,idPostVideo, idPostAudio){
        this.form = document.getElementById(idForm);
        this.textarea = document.getElementById(idTextarea);
        this.ulPost = document.getElementById(idUlPost);
        this.postImage = document.getElementById(idPostImage);
         this.postVideo = document.getElementById(idPostVideo);
         this.postAudio = document.getElementById(idPostAudio);
         this.posts = [];
       this.addSubmit();

       document.getElementById('posts').innerHTML = localStorage.getItem('posts');
    }


    onSubmit(func){
        this.form.addEventListener('submit',func);
    }

    formValidate(value){
        if(value== '' || value == null || value == undefined ){
            return false
        }
        return true
    }

    addSubmit(){
        const handleSubmit = (event) => {
            event.preventDefault();
            if (this.formValidate(this.textarea.value)){
                const newPost = document.createElement('li');
                    newPost.classList.add('post');
                    newPost.innerHTML = `
                    <div class="infoUserPost">
                        <div class="imgUserPost"></div>
        
                            <div class="name">
                                
                                <br>
                                <p style="color:black">Coordenada: ${geo}</p>
                            </div>
                        </div>
                        <p>
                        ${this.textarea.value}
                        </p>
                        <div class="actionBtnPost">
                            
                        </div>`;
                            this.ulPost.append(newPost);
                            this.textarea.value = "";
                            console.log(newPost);

                            if (this.postImage.mostrar)
                     newPost.innerHTML += `<img src="${this.postImage.src}" style="width:30%; margin-bottom: 20px;">`;

                     if (this.postVideo.mostrar)
                     newPost.innerHTML += `<video src="${this.postVideo.src}" controls style="width:30%; margin-bottom: 20px;"></video>`;

                     if (this.postAudio.mostrar)
                     newPost.innerHTML += `<audio src="${this.postAudio.src}" controls style="width:30%; margin-bottom: 20px;"></audio>`;

                     this.ulPost.append(newPost);
                 this.textarea.value = '';
                 this.postImage.src = null;
                 this.postImage.mostrar = false;
                 this.postVideo.src = null;
                 this.postVideo.mostrar = false;
                 this.postAudio.src = null;
                 this.postAudio.mostrar = false;
                

                 this.posts = [...this.posts, '<li class="post">' + newPost.innerHTML + '</li>'];
                 localStorage.setItem('posts', this.posts)
        } else{
            alert('Verifique se o Campo não está vazio.')
        }

        document.querySelector(".show-itens").style.display = 'none';
            }


        this.onSubmit(handleSubmit)

    }
}
const postForm = new FormPost('formPost', 'textarea', 'posts', 'uploadImage', 'uploadVideo', 'uploadAudio');


let photo = document.getElementById('imgPhoto');
let file = document.getElementById('flImage');

photo.addEventListener('click', () => {
    file.click();
});


const flImage = document.querySelector("#flImage");
 flImage.mostrar = false;

 flImage.addEventListener("change", function() {
     const reader = new FileReader();
     reader.addEventListener("load", () => {
         const uploaded_image = reader.result;
         document.querySelector("#uploadImage").mostrar = true;
         document.querySelector("#uploadImage").src = uploaded_image;
         
     });
     reader.readAsDataURL(this.files[0]);
     document.querySelector(".show-itens").style.display = 'block';
     console.log()
 });


 let myVideo = document.getElementById('myVideo');
 let fileVideo = document.getElementById('flVideo');


 myVideo.addEventListener('click', () => {
     fileVideo.click();
 });

 const flVideo = document.querySelector("#flVideo");
 flVideo.mostrar = false;

 flVideo.addEventListener("change", function() {
     const reader = new FileReader();
     reader.addEventListener("load", () => {
         const uploaded_video = reader.result;
         document.querySelector("#uploadVideo").mostrar = true;
         document.querySelector("#uploadVideo").src = uploaded_video;
     });
     reader.readAsDataURL(this.files[0]);
     document.querySelector(".show-itens").style.display = 'block';
 });

 let myAudio = document.getElementById('myAudio');
 let fileAudio = document.getElementById('flAudio');


 myAudio.addEventListener('click', () => {
     flAudio.click();
 });

 //função de upload do audio

 const flAudio = document.querySelector("#flAudio");
 flAudio.mostrar = false;

 flAudio.addEventListener("change", function() {
     const reader = new FileReader();
     reader.addEventListener("load", () => {
         const uploaded_audio = reader.result;
         document.querySelector("#uploadAudio").mostrar = true;
         document.querySelector("#uploadAudio").src = uploaded_audio;
     });
     reader.readAsDataURL(this.files[0]);
    
 });

 let geo ="";
 const successCallBack = (position)=>{
     geo = position.coords.latitude+','+ position.coords.longitude;
 }
 const errorCallBack = (position)=>{
     geo ='';
 }
 navigator.geolocation.getCurrentPosition(successCallBack, errorCallBack);