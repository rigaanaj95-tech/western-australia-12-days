(() => {
  "use strict";

  const BASE_PATH = "assets/documents/encrypted";
  const ITERATIONS = 600_000;
  const MAGIC = "WADOC1";
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  const documentUrls = new Map();
  let vaultPassword = "";

  const GROUPS = [
    {
      title: "证件与通票",
      documents: [
        {
          file: "australia-visa-grant.enc",
          name: "australia-visitor-visa.pdf",
          date: "2026-06-11",
          title: "澳大利亚访客签证获批通知",
          description: "Visitor 600 签证批准文件"
        },
        {
          file: "wa-parks-pass.enc",
          name: "western-australia-parks-pass.pdf",
          date: "2026-09-24",
          title: "西澳国家公园 5 日通票",
          description: "车辆入园通票，使用时需展示"
        }
      ]
    },
    {
      title: "机票行程单",
      documents: [
        {
          file: "outbound-flight-lkk.enc",
          name: "outbound-flight-lkk.pdf",
          date: "2026-09-23",
          title: "上海至珀斯机票行程单 · LKK",
          description: "上海经吉隆坡前往珀斯"
        },
        {
          file: "outbound-flight-ztn.enc",
          name: "outbound-flight-ztn.pdf",
          date: "2026-09-23",
          title: "上海至珀斯机票行程单 · ZTN",
          description: "上海经吉隆坡前往珀斯"
        }
      ]
    },
    {
      title: "住宿确认单",
      documents: [
        {
          file: "hotel-criterion-perth.enc",
          name: "criterion-hotel-perth.pdf",
          date: "09/23–09/24",
          title: "Criterion Hotel Perth",
          description: "珀斯首晚住宿确认单"
        },
        {
          file: "hotel-jurien-bay.enc",
          name: "jurien-bay-motel-apartments.pdf",
          date: "09/24–09/25",
          title: "Jurien Bay Motel Apartments",
          description: "朱里恩湾住宿确认单"
        },
        {
          file: "hotel-questro-breeze.enc",
          name: "questro-breeze-kalbarri.pdf",
          date: "09/25–09/26",
          title: "Questro Breeze",
          description: "卡尔巴里住宿确认单"
        },
        {
          file: "hotel-carnarvon-first.enc",
          name: "hospitality-carnarvon-sep-26.pdf",
          date: "09/26–09/27",
          title: "Hospitality Carnarvon",
          description: "卡那封第一晚住宿确认单"
        },
        {
          file: "hotel-potshot-exmouth.enc",
          name: "potshot-hotel-resort-exmouth.pdf",
          date: "09/27–09/29",
          title: "Potshot Hotel Resort",
          description: "埃克斯茅斯两晚住宿确认单"
        },
        {
          file: "hotel-carnarvon-second.enc",
          name: "hospitality-carnarvon-sep-29.pdf",
          date: "09/29–09/30",
          title: "Hospitality Carnarvon",
          description: "卡那封返程住宿确认单"
        },
        {
          file: "hotel-african-reef.enc",
          name: "african-reef-resort-geraldton.pdf",
          date: "10/01–10/02",
          title: "African Reef Resort",
          description: "杰拉尔顿住宿确认单"
        },
        {
          file: "hotel-vibe-subiaco.enc",
          name: "vibe-hotel-subiaco-perth.pdf",
          date: "10/02–10/04",
          title: "Vibe Hotel Subiaco Perth",
          description: "珀斯最后两晚住宿确认单"
        }
      ]
    },
    {
      title: "活动凭证",
      documents: [
        {
          file: "shark-bay-flight-confirmation.enc",
          name: "shark-bay-scenic-flight-confirmation.pdf",
          date: "2026-09-30",
          title: "Shark Bay 空中观光 · 预订确认",
          description: "Big Lagoon & Salt Ponds 双人行程"
        },
        {
          file: "shark-bay-flight-payment.enc",
          name: "shark-bay-scenic-flight-payment.pdf",
          date: "2026-09-30",
          title: "Shark Bay 空中观光 · 付款凭证",
          description: "Nationwest Aviation 支付收据"
        },
        {
          file: "lancelin-booking.enc",
          name: "lancelin-quad-booking.pdf",
          date: "2026-10-02",
          title: "Lancelin 越野车与滑沙 · 预订确认",
          description: "双人越野车及滑沙行程"
        },
        {
          file: "lancelin-payment.enc",
          name: "lancelin-quad-payment.pdf",
          date: "2026-10-02",
          title: "Lancelin 越野车与滑沙 · 付款凭证",
          description: "Perth Quad 支付收据"
        }
      ]
    }
  ];

  function escapeHtml(value = "") {
    return String(value).replace(/[&<>"']/g, (character) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "\"": "&quot;",
      "'": "&#39;"
    })[character]);
  }

  function documentMarkup(document) {
    return `
      <article class="document-item">
        <div class="document-item__meta">
          <span class="document-type">PDF</span>
          <time>${escapeHtml(document.date)}</time>
        </div>
        <h3>${escapeHtml(document.title)}</h3>
        <p>${escapeHtml(document.description)}</p>
        <button type="button" data-document-file="${escapeHtml(document.file)}" data-document-name="${escapeHtml(document.name)}">打开 PDF</button>
      </article>`;
  }

  function renderVault(root) {
    const count = GROUPS.reduce((total, group) => total + group.documents.length, 0);
    root.innerHTML = `
      <form class="document-unlock" data-document-unlock>
        <label>
          <span>访问密码</span>
          <input type="password" name="password" minlength="8" autocomplete="current-password" required>
        </label>
        <button type="submit">解锁 ${count} 份文件</button>
        <p data-document-status aria-live="polite">原件已加密</p>
      </form>
      <div class="document-groups" data-document-groups hidden>
        ${GROUPS.map((group) => `
          <section class="document-group" aria-labelledby="document-group-${escapeHtml(group.title)}">
            <h3 id="document-group-${escapeHtml(group.title)}">${escapeHtml(group.title)}</h3>
            <div class="document-list">${group.documents.map(documentMarkup).join("")}</div>
          </section>`).join("")}
      </div>`;
  }

  async function deriveKey(password, salt) {
    const material = await crypto.subtle.importKey(
      "raw",
      encoder.encode(password),
      "PBKDF2",
      false,
      ["deriveKey"]
    );
    return crypto.subtle.deriveKey(
      { name: "PBKDF2", hash: "SHA-256", salt, iterations: ITERATIONS },
      material,
      { name: "AES-GCM", length: 256 },
      false,
      ["decrypt"]
    );
  }

  async function decryptPayload(buffer, password) {
    const bytes = new Uint8Array(buffer);
    if (decoder.decode(bytes.slice(0, 6)) !== MAGIC) throw new Error("Invalid encrypted document");
    const salt = bytes.slice(6, 22);
    const iv = bytes.slice(22, 34);
    const key = await deriveKey(password, salt);
    return crypto.subtle.decrypt({ name: "AES-GCM", iv, tagLength: 128 }, key, bytes.slice(34));
  }

  async function fetchEncrypted(file) {
    const response = await fetch(`${BASE_PATH}/${encodeURIComponent(file)}`, { cache: "force-cache" });
    if (!response.ok) throw new Error(`Document ${response.status}`);
    return response.arrayBuffer();
  }

  async function verifyPassword(password) {
    const plaintext = await decryptPayload(await fetchEncrypted("vault-check.enc"), password);
    return decoder.decode(plaintext) === "west-australia-travel-documents";
  }

  function shouldOpenInSameTab() {
    const userAgent = navigator.userAgent || "";
    const appleTouchDevice = /iPad|iPhone|iPod/.test(userAgent)
      || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    return appleTouchDevice
      || /Android/i.test(userAgent)
      || window.matchMedia("(max-width: 700px)").matches;
  }

  async function unlockVault(form) {
    const status = form.querySelector("[data-document-status]");
    const button = form.querySelector("button");
    const password = new FormData(form).get("password")?.toString() || "";
    button.disabled = true;
    status.textContent = "正在验证";
    try {
      if (!await verifyPassword(password)) throw new Error("Invalid password");
      vaultPassword = password;
      form.hidden = true;
      form.parentElement.querySelector("[data-document-groups]").hidden = false;
    } catch {
      status.textContent = "密码不正确";
      form.querySelector("input").select();
    } finally {
      button.disabled = false;
    }
  }

  async function openDocument(button) {
    const file = button.dataset.documentFile;
    const readyUrl = documentUrls.get(file);
    if (readyUrl) {
      window.location.assign(readyUrl);
      return;
    }

    const name = button.dataset.documentName || "travel-document.pdf";
    const openInSameTab = shouldOpenInSameTab();
    const preview = openInSameTab ? null : window.open("about:blank", "_blank");
    if (preview) preview.opener = null;
    button.disabled = true;
    button.textContent = "正在解密";
    try {
      const plaintext = await decryptPayload(await fetchEncrypted(file), vaultPassword);
      const url = URL.createObjectURL(new File([plaintext], name, { type: "application/pdf" }));
      documentUrls.set(file, url);
      if (preview) {
        preview.location.replace(url);
        button.textContent = "打开 PDF";
      } else {
        button.textContent = "点击查看 PDF";
        button.focus();
      }
    } catch {
      if (preview) preview.close();
      button.textContent = "打开失败";
      return;
    } finally {
      button.disabled = false;
    }
  }

  function init() {
    const root = document.querySelector("#document-vault");
    if (!root || !globalThis.crypto?.subtle) return;
    renderVault(root);
    root.addEventListener("submit", (event) => {
      event.preventDefault();
      unlockVault(event.target);
    });
    root.addEventListener("click", (event) => {
      const button = event.target.closest("[data-document-file]");
      if (button) openDocument(button);
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
  else init();
})();
