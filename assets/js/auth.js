import { auth } from "./firebase-config.js";

import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  setPersistence,
  browserLocalPersistence,
  sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

function emailInstitucional(email) {
  return email.trim().toLowerCase().endsWith("@discente.ifpe.edu.br");
}

window.logar = async function(email, senha){
  if(!email || !senha){
    alert("Preencha e-mail e senha.");
    return;
  }

  if(!emailInstitucional(email)){
  alert("Use apenas e-mails @discente.ifpe.edu.br");
  return;
  }

  try {
    await setPersistence(auth, browserLocalPersistence);

    const userCredential = await signInWithEmailAndPassword(
      auth,
      email.trim(),
      senha
    );

    console.log("Logado:", userCredential.user.email);

    setTimeout(() => {
      window.location.href = "./painel.html";
    }, 300);

  } catch(error) {
    console.error(error);

    if(error.code === "auth/invalid-credential"){
      alert("E-mail ou senha incorretos.");
    } else {
      alert(error.message);
    }
  }
};

window.cadastrar = async function(email, senha){
  if(!email || !senha){
    alert("Preencha e-mail e senha.");
    return;
  }

  if(!emailInstitucional(email)){
  alert("Só é permitido cadastro com e-mail institucional do IFPE.");
  return;
  }
  try {
    await createUserWithEmailAndPassword(auth, email.trim(), senha);

    alert("Conta criada com sucesso!");
    window.location.href = "./painel.html";

  } catch(error){
    console.error(error);

    if(error.code === "auth/email-already-in-use"){
      alert("Esse e-mail já está cadastrado.");
    } else if(error.code === "auth/weak-password"){
      alert("A senha deve ter pelo menos 6 caracteres.");
    } else {
      alert(error.message);
    }
  }
};

window.sair = async function(){
  try {
    await signOut(auth);
    window.location.href = "./login.html";
  } catch(error){
    console.error(error);
    alert("Erro ao sair da conta.");
  }
};

window.recuperarSenha = async function(email){
  if(!email){
    alert("Digite seu e-mail.");
    return;
  }

  try {
    await sendPasswordResetEmail(auth, email.trim());

    alert("Link de redefinição enviado para seu e-mail!");

  } catch(error){
    console.error(error);

    if(error.code === "auth/user-not-found"){
      alert("E-mail não encontrado.");
    } else if(error.code === "auth/invalid-email"){
      alert("E-mail inválido.");
    } else {
      alert("Erro ao enviar e-mail. Tente novamente.");
    }
  }
};
