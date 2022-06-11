export class FormPost{

    constructor(idForm, idTextarea, idUlPost){
        this.form = document.getElementById(idForm);
        this.textarea = document.getElementById(idTextarea);
        this.ulPost = document.getElementById(idUlPost);
       this.addSubmit();
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
        
            if (this.textarea.value.trim()){
                console.log("testando");
                let post = JSON.parse(localStorage.getItem("posts")) || [];
                let user = JSON.parse(localStorage.getItem("user")) || [];
                let arquivo = document.getElementById("postMidia") || "";
                post.push({
                    user:user.username,
                    texto:this.textarea.value,
                    tipo:arquivo.src.split("/")[0].split(":") [1],
                    arquivo:arquivo.src
                });
                 localStorage.setItem("posts", JSON.stringify(post));   
        } else{
            alert('Verifique se o Campo não está vazio.')
        }
            
            

        this.onSubmit(handleSubmit)

    }
}
const postForm = new FormPost('formPost','textarea','posts')

function carregaPost() {
    const newPost = document.createElement('li');
                    newPost.classList.add('post');
                    newPost.innerHTML = `
                    <div class="infoUserPost">
                        <div class="imgUserPost"></div>
        
                            <div class="name">
                                <strong>Username</strong>
                            </div>
                        </div>
                        <p>
                        ${this.textarea.value}
                        </p>

                        <div class="actionBtnPost">
                            <button type="button" class="filesPost like"><img src="./Imagens/heart.svg" alt="Curtir">Curtir</button>
                            <button type="button" class="filesPost share"><img src="./Imagens/share.svg" alt="Compartilhar">Compartilhar</button>
                            <button type="button" class="filesPost comment"><img src="./Imagens/comment.svg" alt="Comentar">Comentar</button>
                        </div>`;
                            this.ulPost.append(newPost);
                            this.textarea.value = "";
}