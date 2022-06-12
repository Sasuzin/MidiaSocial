function logout(){

    localStorage.removeItem('token');
    location.href='form.html';
}
