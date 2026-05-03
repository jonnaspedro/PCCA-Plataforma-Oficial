import { db, auth } from "./firebase-config.js";

import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  doc,
  updateDoc,
  deleteDoc,
  setDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

function salvarPerfil() {
    const nome = document.getElementById("nome")?.value || "";
    const turma = document.getElementById("turma")?.value || "";
    const curso = document.getElementById("curso")?.value || "";
    const fotoInput = document.getElementById("foto");

    let perfil = { nome, turma, curso, foto: "" };

    if (fotoInput && fotoInput.files[0]) {
        const reader = new FileReader();

        reader.onload = function (e) {
            perfil.foto = e.target.result;
            localStorage.setItem("perfilAluno", JSON.stringify(perfil));
            alert("Perfil salvo com sucesso!");
            carregarPerfil();
        };

        reader.readAsDataURL(fotoInput.files[0]);

    } else {
        localStorage.setItem("perfilAluno", JSON.stringify(perfil));
        alert("Perfil salvo com sucesso!");
        carregarPerfil();
    }
}

function carregarPerfil() {
    const dados = JSON.parse(localStorage.getItem("perfilAluno"));
    if (!dados) return;

    if (document.getElementById("nome"))
        document.getElementById("nome").value = dados.nome || "";

    if (document.getElementById("turma"))
        document.getElementById("turma").value = dados.turma || "";
    
}

const disciplinas = [
    // 1º Ano
    "Artes 1",
    "Biologia 1",
    "Ciência, Tecnologia e Sociedade",
    "Cidadania e Ética 1",
    "Filosofia 1",
    "Física 1",
    "Geografia 1",
    "História 1",
    "Informática e Redes",
    "Língua Inglesa 1",
    "Língua Portuguesa 1",
    "Matemática 1",
    "Programação 1",
    "Projeto e Prática 1",
    "Química 1",

    // 2º Ano
    "Banco de Dados",
    "Desenvolvimento Web",
    "Programação 2",
    "Matemática 2",
    "Física 2",
    "Química 2",

    // 3º Ano
    "Programação 3",
    "Matemática 3",
    "Física 3",
    "Química 3",
    "Testes e Software",
    "Empreendedorismo"
];

function filtrarDisciplinas() {
    const input = document.getElementById("disciplina")?.value.toLowerCase() || "";
    const datalist = document.getElementById("listaSugestoes");

    if (!datalist) return;

    datalist.innerHTML = "";

    disciplinas
        .filter(d => d.toLowerCase().includes(input))
        .forEach(d => {
            const option = document.createElement("option");
            option.value = d;
            datalist.appendChild(option);
        });
}

window.publicarPergunta = async function () {

    const user = auth.currentUser;

    if (!user) {
        alert("Faça login para publicar.");
        return;
    }

    const nome = document.getElementById("nome").value.trim();
    const titulo = document.getElementById("titulo").value.trim();
    const disciplina = document.getElementById("disciplina").value.trim();
    const texto = document.getElementById("texto").value.trim();

    if (!nome || !titulo || !disciplina || !texto) {
        alert("Preencha todos os campos!");
        return;
    }

    await addDoc(collection(db, "perguntas"), {
        uid: user.uid,
        nome,
        email: user.email,
        titulo,
        disciplina,
        texto,
        curtidas: 0,
        data: serverTimestamp()
    });

    alert("Pergunta publicada!");

    document.getElementById("formPergunta").reset();

    const nomeInput = document.getElementById("nome");
    if (nomeInput) nomeInput.value = user.email;

    carregarPerguntas();
};

async function carregarPerguntas() {

    const container = document.getElementById("minhasPerguntas");
    if (!container) return;

    container.innerHTML = "";

    const user = auth.currentUser;
    const snapshot = await getDocs(collection(db, "perguntas"));

    snapshot.forEach((item) => {

        const p = item.data();
        const id = item.id;

        let botoesAutor = "";

        if (user && user.uid === p.uid) {
            botoesAutor = `
                <button onclick="editarPergunta('${id}')">✏️ Editar</button>
                <button onclick="excluirPergunta('${id}')">🗑 Excluir</button>
            `;
        }

        const card = document.createElement("div");
        card.className = "cardPergunta";

        card.innerHTML = `
            <h4>${p.titulo || "Sem título"}</h4>
            <small>${p.disciplina || ""} | ${p.nome || "Usuário"}</small>
            <p>${p.texto || ""}</p>

            <div class="acoesPergunta">
                <button onclick="curtirPergunta('${id}')">
                    👍 ${p.curtidas || 0}
                </button>

                <button onclick="abrirComentarios('${id}')">
                    💬 Comentários
                </button>

                ${botoesAutor}
            </div>

            <div id="comentarios-${id}" class="comentariosBox"></div>
        `;

        container.appendChild(card);
    });
}

window.curtirPergunta = async function (id) {

    const user = auth.currentUser;

    if (!user) {
        alert("Faça login.");
        return;
    }

    const likeRef = doc(db, "perguntas", id, "likes", user.uid);
    const likeSnap = await getDoc(likeRef);

    if (likeSnap.exists()) {
        alert("Você já curtiu.");
        return;
    }

    await setDoc(likeRef, { uid: user.uid });

    const perguntaRef = doc(db, "perguntas", id);
    const perguntaSnap = await getDoc(perguntaRef);

    const atual = perguntaSnap.data().curtidas || 0;

    await updateDoc(perguntaRef, {
        curtidas: atual + 1
    });

    carregarPerguntas();
};

window.excluirPergunta = async function (id) {

    if (!confirm("Deseja excluir esta pergunta?")) return;

    await deleteDoc(doc(db, "perguntas", id));
    carregarPerguntas();
};

window.editarPergunta = async function (id) {

    const novoTexto = prompt("Digite o novo texto:");

    if (!novoTexto || novoTexto.trim() === "") return;

    await updateDoc(doc(db, "perguntas", id), {
        texto: novoTexto.trim()
    });

    carregarPerguntas();
};


window.abrirComentarios = async function (id) {

    const box = document.getElementById("comentarios-" + id);

    if (box.dataset.aberto === "true") {
        box.innerHTML = "";
        box.dataset.aberto = "false";
        return;
    }

    box.dataset.aberto = "true";

    box.innerHTML = `
        <div class="comentariosPainel">

            <div class="comentariosHeader">
                <span>💬 Comentários</span>

                <button 
                    class="btnFecharComentarios"
                    onclick="abrirComentarios('${id}')">
                    ✖
                </button>
            </div>

            <div class="comentarioTopo">
                <textarea
                    id="txt-${id}"
                    class="campoComentario"
                    placeholder="Escreva seu comentário..."
                    rows="3"
                ></textarea>

                <button 
                    class="btnEnviarComentario"
                    onclick="enviarComentario('${id}')">
                    Enviar
                </button>
            </div>

            <div id="lista-${id}" class="listaComentarios"></div>

        </div>
    `;

    const lista = document.getElementById("lista-" + id);
    const user = auth.currentUser;

    const snapshot = await getDocs(
        collection(db, "perguntas", id, "comentarios")
    );

    snapshot.forEach((docItem) => {

        const c = docItem.data();
        const comentarioId = docItem.id;

        if (!c.nome || !c.texto || c.texto.trim() === "") return;

        let controles = "";

        if (user && user.uid === c.uid) {
            controles = `
                <div class="acoesMini">
                    <button onclick="editarComentario('${id}','${comentarioId}')">Editar</button>
                    <button onclick="excluirComentario('${id}','${comentarioId}')">Excluir</button>
                </div>
            `;
        }

        lista.innerHTML += `
            <div class="itemComentario">
                <b>${c.nome}</b>
                <p>${c.texto}</p>
                ${controles}
            </div>
        `;
    });
};

window.enviarComentario = async function (id) {

    const user = auth.currentUser;

    if (!user) {
        alert("Faça login.");
        return;
    }

    const input = document.getElementById("txt-" + id);
    const texto = input.value.trim();

    if (!texto) return;

    await addDoc(
        collection(db, "perguntas", id, "comentarios"),
        {
            uid: user.uid,
            nome: user.email,
            texto,
            data: serverTimestamp()
        }
    );

    abrirComentarios(id);
};

window.excluirComentario = async function (perguntaId, comentarioId) {

    if (!confirm("Deseja excluir este comentário?")) return;

    await deleteDoc(
        doc(db, "perguntas", perguntaId, "comentarios", comentarioId)
    );

    abrirComentarios(perguntaId);
};

window.editarComentario = async function (perguntaId, comentarioId) {

    const novoTexto = prompt("Digite o novo comentário:");

    if (!novoTexto || novoTexto.trim() === "") return;

    await updateDoc(
        doc(db, "perguntas", perguntaId, "comentarios", comentarioId),
        {
            texto: novoTexto.trim()
        }
    );

    abrirComentarios(perguntaId);
};

function atualizarConteudosDisciplina() {

    const container = document.getElementById("conteudosDisciplina");
    if (!container) return;

    container.innerHTML = "";

    let conteudos =
        JSON.parse(localStorage.getItem("conteudos")) || [];

    conteudos.forEach(c => {

        const card = document.createElement("div");

        card.innerHTML = `
            <h4>${c.titulo}</h4>
            <p>${c.descricao}</p>
        `;

        container.appendChild(card);
    });
}

document.addEventListener("DOMContentLoaded", () => {

    carregarPerfil();
    atualizarConteudosDisciplina();

    onAuthStateChanged(auth, () => {
        carregarPerguntas();
    });

});