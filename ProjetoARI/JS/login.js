function entrar(){
   let email = document.querySelector('email');
   
   let senha = document.querySelector('senha');
   
   let userValid = {
    nome: '',
    email: '',
    senha:''
   }

   user = JSON.parse(localStorage.getItem('user'));

   console.log(user);
}