function entrar(){
   let email = document.querySelector('#email');
   let emailLabel = document.querySelector('#emailLabel')
   
   let password = document.querySelector('#password');
   let passwordLabel = document.querySelector('#passwordLabel')

   let msgError = document.querySelector('#msgError')

   let listaUser = [];
   
   let userValid = {
    nome: '',
    email: '',
    password:''
   }

   listaUser = JSON.parse(localStorage.getItem('listaUser'));

   listaUser.forEach((item) => {
        if(email.value == item.email && senha.value == item.password){
            userValid = {
                username: item.username,
                email: item.email,
                password: item.password
            }
        }
   });

if(email.value == userValid.email && senha.value == userValid.password){
    window.location.href = 'home.html';

    let token = Math.random().toString(16)
    localStorage.setItem('token',token)
    
    localStorage.setItem('userLogado', JSON.stringify('userValid'))

} else {
    msgError.innerHTML = 'Email ou senha incorretos'
}

}