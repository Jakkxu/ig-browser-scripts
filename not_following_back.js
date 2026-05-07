(async () => {
    const sleep = (ms) => new Promise(r => setTimeout(r, ms));

    const username = location.pathname.split("/").filter(Boolean)[0];

    if (!username) {
        alert("เข้า profile IG ก่อน");
        return;
    }

    const findButton = (text) => {
        return [...document.querySelectorAll("a, button")]
            .find(el =>
                el.innerText?.toLowerCase().includes(text)
            );
    };

    const openList = async (type) => {
        const btn =
            findButton(type) ||
            [...document.querySelectorAll('a[href]')]
                .find(a => a.href.includes(`/${type}`));

        if (!btn) {
            throw new Error(`หา ${type} button ไม่เจอ`);
        }

        btn.click();

        await sleep(3000);
    };

    const getDialog = () =>
        document.querySelector('div[role="dialog"]');

    const getScroller = () => {
        const dialog = getDialog();

        if (!dialog) return null;

        return [...dialog.querySelectorAll("div")]
            .find(el =>
                el.scrollHeight > el.clientHeight
            );
    };

    const autoScroll = async () => {
        const scroller = getScroller();

        if (!scroller) {
            throw new Error("หา scroller ไม่เจอ");
        }

        let lastHeight = 0;
        let same = 0;

        while (same < 8) {
            scroller.scrollTo(0, scroller.scrollHeight);

            await sleep(1200);

            if (scroller.scrollHeight === lastHeight) {
                same++;
            } else {
                same = 0;
            }

            lastHeight = scroller.scrollHeight;

            console.log("Scrolling...", scroller.scrollHeight);
        }
    };

    const getUsers = () => {
        return [...new Set(
            [...document.querySelectorAll('div[role="dialog"] a[href^="/"]')]
                .map(a => a.getAttribute("href"))
                .filter(h =>
                    h &&
                    /^\/[A-Za-z0-9._]+\/$/.test(h)
                )
                .map(h => h.replaceAll("/", ""))
        )];
    };

    const closeDialog = () => {
        const closeBtn =
            document.querySelector('svg[aria-label="Close"]')?.closest("button");

        closeBtn?.click();
    };

    console.clear();

    console.log("Opening Following...");

    await openList("following");

    await autoScroll();

    const following = getUsers();

    console.log("Following:", following.length);

    closeDialog();

    await sleep(2000);

    console.log("Opening Followers...");

    await openList("followers");

    await autoScroll();

    const followers = getUsers();

    console.log("Followers:", followers.length);

    const notFollowingBack = following.filter(
        user => !followers.includes(user)
    );

    console.clear();

    console.log(
        `----[ NOT FOLLOWING BACK (${notFollowingBack.length}) ]----`,
    );

    notFollowingBack.forEach(user => {
        const url = `https://instagram.com/${user}`;

        console.log(
            `%c@${user}`,
            "color:#4ea1ff;font-size:14px;text-decoration:underline;"
        );

        console.log(url);
    });

    copy(notFollowingBack.join("\n"));

})();