// KB2 input contract from the captured web match. The preview owns motion and rendering.
export const KB2_BUTTON = Object.freeze({
    melee: 1, ranged: 2, block: 4, magic: 8, scroll1: 16, scroll2: 32, scroll3: 64
});

const buttonByKey = new Map([
    ["KeyS", KB2_BUTTON.melee], ["KeyD", KB2_BUTTON.ranged],
    ["ArrowDown", KB2_BUTTON.block], ["Space", KB2_BUTTON.block],
    ["KeyR", KB2_BUTTON.magic], ["KeyQ", KB2_BUTTON.scroll1],
    ["KeyW", KB2_BUTTON.scroll2], ["KeyE", KB2_BUTTON.scroll3]
]);
const movementKeys = new Set(["ArrowLeft", "ArrowRight", "ArrowUp", "KeyA"]);

export function createKB2Input() {
    const held = new Set();
    let buttons = 0;
    return {
        keyDown(code) {
            if (!movementKeys.has(code) && !buttonByKey.has(code)) return false;
            if (!held.has(code)) buttons |= buttonByKey.get(code) ?? 0;
            held.add(code);
            return true;
        },
        keyUp(code) {
            return held.delete(code);
        },
        clear() {
            held.clear();
            buttons = 0;
        },
        takeFrame() {
            const frame = {
                x: Number(held.has("ArrowRight")) - Number(held.has("ArrowLeft")),
                y: held.has("ArrowUp") ? -1 : 0,
                run: Number(held.has("KeyA")),
                buttons,
                blockHeld: Number(held.has("ArrowDown") || held.has("Space")),
                rotate: 1
            };
            buttons = 0;
            return frame;
        }
    };
}
