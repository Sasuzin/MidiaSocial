const form = document.getElementById('form')
const username = document.getElementById('username')
const email = document.getElementById('email')
const password = document.getElementById('password')
const passwordtwo = document.getElementById('password-two')
const CPF = document.getElementById('CPF')


form.addEventListener('submit', (e) => {
    e.preventDefault()

    checkInputs()
})


function checkInputs() {

    const usernameValue = username.value.trim()
    const emailValue = email.value.trim()
    const passwordValue = password.value.trim()
    const passwordtwoValue = passwordtwo.value.trim()
    const CPFValue = CPF.value.trim()
    

    if(usernameValue === '') {
        // mostrar erro
        // add classe
        setErrorFor(username, 'Preencha esse campo');
        return;
    } else if((usernameValue.leghth < 3) && (usernameValue.leghth > 50)){
        setErrorFor(username, 'O nome deve conter no minimo 3 letras e no maximo 50 letras');
        return;
        
    }
    else {
        // adicionar a classe de sucesso
        setSuccessFor(username)
        
    }

    if(emailValue === '') {
        // mostrar erro
        // add classe
        setErrorFor(email, 'Preencha esse campo');
        return;
    } else if (!isEmail(emailValue)) {
        setErrorFor(email, 'Email inválido');
        return;
    } else {
        // adicionar a classe de sucesso
        setSuccessFor(email)
        
    }
   
    if(passwordValue === '') {
        // mostrar erro
        // add classe
        setErrorFor(password, 'Preencha esse campo');
        return;
    } else{
        // adicionar a classe de sucesso
        setSuccessFor(password)
    }
     let isUpperCase = (passwordValue[0] == passwordValue[0].toUpperCase())
     if(isUpperCase) {
         setSuccessFor (password)
     } else {
         setErrorFor(password,"A primeira letra não é maiuscula");
         return;
     }

    if(passwordtwoValue === '') {
        // mostrar erro
        // add classe
        setErrorFor(passwordtwo, 'Preencha esse campo');
        return;
    } else if(passwordValue !== passwordtwoValue) { 
        setErrorFor(passwordtwo, 'Senhas não tão iguais');
        return;
    } else {
        // adicionar a classe de sucesso
        setSuccessFor(passwordtwo)
    }

    if(CPFValue === ''){
        // mostrar erro
        // add classe
        setErrorFor(CPF, 'Preencha esse campo');
        return;
    } else{
        // adicionar a classe de sucesso
        setSuccessFor(CPF)
    }

    let users = JSON.parse(localStorage.getItem('Users')) || [];
    users.push({
        username: username.value,
        CPF: CPF.value,
        email: email.value,
        password: password.value,
    });

    let user = {
        username: username.value,
        CPF: CPF.value,
        email: email.value,
        password: password.value,
    };
    localStorage.setItem('user', JSON.stringify(user));

    localStorage.setItem('Users', JSON.stringify(users));
    let formRegister = document.getElementsByClassName('form');
    formRegister[0].style.display = 'none';

    location.href = "home.html";
    

}

function setErrorFor(input, message) {
    const formControl = input.parentElement;
    const small = formControl.querySelector('small')

    small.innerText = message

    formControl.className = 'form-control error'
}

function setSuccessFor(input) {
    const formControl = input.parentElement;

    formControl.className = 'form-control success'
}

function isEmail(email) {
    return /^(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/.test(email)
}

function mascara_cpf() {
    let cpf = document.getElementById('CPF')
        if(cpf.value.length == 3 || cpf.value.length == 7) {
            cpf.value += "."
        } else if (cpf.value.length == 11) {
            cpf.value += "-"
        }
}






