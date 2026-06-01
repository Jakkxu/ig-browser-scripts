(async () => {
    const sleep = (ms) => new Promise(r => setTimeout(r, ms));

    const getFormattedTimestamp = () => {
        const now  = new Date();
        const mm   = String(now.getMonth() + 1).padStart(2, "0");
        const dd   = String(now.getDate()).padStart(2, "0");
        const yyyy = now.getFullYear();
        const hh   = String(now.getHours()).padStart(2, "0");
        const min  = String(now.getMinutes()).padStart(2, "0");
        const ss   = String(now.getSeconds()).padStart(2, "0");
        return `${mm}${dd}${yyyy}_${hh}${min}${ss}`;
    };

    const downloadTextFile = (usernameArray, prefix) => {
        const filename = `${prefix}_${getFormattedTimestamp()}.txt`;
        const content  = usernameArray.map(u => `@${u}`).join("\n");
        const blob     = new Blob([content], { type: "text/plain" });
        const url      = URL.createObjectURL(blob);
        const a        = document.createElement("a");
        a.href         = url;
        a.download     = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
    };

    const readUsernamesFromFile = (file) => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const matches   = [...e.target.result.matchAll(/@([A-Za-z0-9._]+)/g)];
            const usernames = [...new Set(matches.map(m => m[1]))];
            resolve(usernames);
        };
        reader.onerror = () => reject(new Error("FileReader failed"));
        reader.readAsText(file);
    });

    const findUnfollowers = (past, current) => past.filter(u => !current.includes(u));

    const showMainModal = (followers, following) => new Promise((resolve) => {
        const notFollowingBack = following.filter(u => !followers.includes(u));

        const overlay = document.createElement("div");
        overlay.style.cssText = `
            position:fixed;inset:0;z-index:999999;
            background:rgba(0,0,0,0.75);backdrop-filter:blur(8px);
            display:flex;align-items:center;justify-content:center;
            font-family:'Segoe UI',system-ui,sans-serif;
        `;

        overlay.innerHTML = `
            <div style="
                background:#111318;border:1px solid #2a2a3a;border-radius:18px;
                padding:32px 36px;width:440px;max-width:92vw;
                box-shadow:0 32px 80px rgba(0,0,0,0.7);color:#e8e8f0;
                display:flex;flex-direction:column;gap:20px;
            ">
                <div style="font-size:18px;font-weight:700;letter-spacing:-0.3px;color:#fff;">
                    Instagram Tracker
                </div>

                <div style="display:flex;gap:10px;">
                    <div style="
                        flex:1;background:#1a1a2e;border:1px solid #2a2a40;border-radius:10px;
                        padding:14px 16px;text-align:center;
                    ">
                        <div style="font-size:22px;font-weight:700;color:#818cf8;">${followers.length}</div>
                        <div style="font-size:11px;color:#6b7280;margin-top:2px;">Followers</div>
                    </div>
                    <div style="
                        flex:1;background:#1a1a2e;border:1px solid #2a2a40;border-radius:10px;
                        padding:14px 16px;text-align:center;
                    ">
                        <div style="font-size:22px;font-weight:700;color:#818cf8;">${following.length}</div>
                        <div style="font-size:11px;color:#6b7280;margin-top:2px;">Following</div>
                    </div>
                    <div style="
                        flex:1;background:#1a1a2e;border:1px solid #2a2a40;border-radius:10px;
                        padding:14px 16px;text-align:center;
                    ">
                        <div style="font-size:22px;font-weight:700;color:#f59e0b;">${notFollowingBack.length}</div>
                        <div style="font-size:11px;color:#6b7280;margin-top:2px;">Not Following Back</div>
                    </div>
                </div>

                <div style="border-top:1px solid #2a2a3a;padding-top:16px;">
                    <div style="font-size:13px;color:#9ca3af;margin-bottom:10px;">
                        Select a saved <code style="color:#a78bfa;background:#1e1b4b;padding:2px 5px;border-radius:4px;">follower_*.txt</code> to detect unfollowers
                    </div>
                    <input id="ig-file-input" type="file" accept=".txt" style="
                        background:#0d0d1a;border:1px dashed #374151;border-radius:8px;
                        padding:10px 12px;color:#ccc;font-size:12px;cursor:pointer;
                        width:100%;box-sizing:border-box;
                    "/>
                </div>

                <div style="display:flex;gap:10px;flex-direction:column;">
                    <div style="display:flex;gap:10px;">
                        <button id="btn-unfollowers" style="
                            flex:1;padding:11px;border-radius:8px;border:none;
                            background:linear-gradient(135deg,#7c3aed,#4f46e5);
                            color:#fff;font-size:13px;font-weight:600;cursor:pointer;
                        ">0. Unfollower List</button>
                        <button id="btn-notback" style="
                            flex:1;padding:11px;border-radius:8px;border:none;
                            background:linear-gradient(135deg,#0369a1,#0284c7);
                            color:#fff;font-size:13px;font-weight:600;cursor:pointer;
                        ">1. Not Following Back List</button>
                    </div>
                    <button id="btn-close" style="
                        padding:10px;border-radius:8px;border:1px solid #374151;
                        background:transparent;color:#6b7280;font-size:13px;cursor:pointer;
                    ">Close</button>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);

        const displayNotFollowingBack = () => {
            console.clear();
            console.log(`%c---- NOT FOLLOWING BACK (${notFollowingBack.length}) ----`, "color:#38bdf8;font-size:15px;font-weight:bold;");
            notFollowingBack.forEach(user => {
                console.log(`%c@${user}`, "color:#38bdf8;font-size:14px;text-decoration:underline;");
                console.log(`https://www.instagram.com/${user}/`);
            });
            copy(notFollowingBack.join("\n"));
            console.log(`%c${notFollowingBack.length} users copied to clipboard.`, "color:#6b7280;font-size:12px;");
        };

        const displayUnfollowerList = async () => {
            const fileInput = document.getElementById("ig-file-input");
            const file = fileInput.files[0];
            if (!file) {
                alert("Please select a past follower_*.txt file first.");
                return;
            }
            const pastFollowers = await readUsernamesFromFile(file);
            const unfollowers   = findUnfollowers(pastFollowers, followers);
            console.clear();
            if (!unfollowers.length) {
                console.log("%cNo unfollowers detected.", "color:#4ade80;font-size:15px;font-weight:bold;");
                return;
            }
            console.log(`%c---- UNFOLLOWERS (${unfollowers.length}) ----`, "color:#f87171;font-size:15px;font-weight:bold;");
            unfollowers.forEach(user => {
                console.log(`%c@${user}`, "color:#f87171;font-size:14px;font-weight:bold;text-decoration:underline;");
                console.log(`%chttps://www.instagram.com/${user}/`, "color:#fb923c;font-size:12px;");
            });
            copy(unfollowers.join("\n"));
            console.log(`%c${unfollowers.length} usernames copied to clipboard.`, "color:#6b7280;font-size:12px;");
        };

        document.getElementById("btn-unfollowers").onclick = displayUnfollowerList;
        document.getElementById("btn-notback").onclick     = displayNotFollowingBack;
        document.getElementById("btn-close").onclick       = () => { overlay.remove(); resolve(); };
    });

    const username = location.pathname.split("/").filter(Boolean)[0];
    if (!username) {
        alert("Please navigate to an Instagram profile page first.");
        return;
    }

    const findButton = (text) =>
        [...document.querySelectorAll("a, button")]
            .find(el => el.innerText?.toLowerCase().includes(text));

    const openList = async (type) => {
        const btn =
            findButton(type) ||
            [...document.querySelectorAll("a[href]")].find(a => a.href.includes(`/${type}`));
        if (!btn) throw new Error(`Cannot find "${type}" button.`);
        btn.click();
        await sleep(3000);
    };

    const getDialog   = () => document.querySelector('div[role="dialog"]');
    const getScroller = () => {
        const dialog = getDialog();
        if (!dialog) return null;
        return [...dialog.querySelectorAll("div")].find(el => el.scrollHeight > el.clientHeight);
    };

    const autoScroll = async () => {
        const scroller = getScroller();
        if (!scroller) throw new Error("Cannot find scroll container.");
        let lastHeight = 0, same = 0;
        while (same < 8) {
            scroller.scrollTo(0, scroller.scrollHeight);
            await sleep(1200);
            scroller.scrollHeight === lastHeight ? same++ : (same = 0);
            lastHeight = scroller.scrollHeight;
            console.log("Scrolling...", scroller.scrollHeight);
        }
    };

    const getUsers = () => [...new Set(
        [...document.querySelectorAll('div[role="dialog"] a[href^="/"]')]
            .map(a => a.getAttribute("href"))
            .filter(h => h && /^\/[A-Za-z0-9._]+\/$/.test(h))
            .map(h => h.replaceAll("/", ""))
    )];

    const closeDialog = () =>
        document.querySelector('svg[aria-label="Close"]')?.closest("button")?.click();

    console.clear();
    console.log("Opening Following...");
    await openList("following");
    await autoScroll();
    const following = getUsers();
    console.log(`Following: ${following.length}`);
    closeDialog();
    await sleep(2000);

    console.log("Opening Followers...");
    await openList("followers");
    await autoScroll();
    const followers = getUsers();
    console.log(`Followers: ${followers.length}`);
    closeDialog();
    await sleep(1000);

    downloadTextFile(followers, "follower");
    await sleep(800);
    downloadTextFile(following, "following");
    await sleep(800);

    await showMainModal(followers, following);
})();
