export const HandJointIDs = Object.freeze({
    WRIST: 0,

    THUMB_METACARPAL: 1,
    THUMB_PHALANX_PROXIMAL: 2,
    THUMB_PHALANX_DISTAL: 3,
    THUMB_TIP: 4,

    INDEX_METACARPAL: 5,
    INDEX_PHALANX_PROXIMAL: 6,
    INDEX_PHALANX_INTERMEDIATE: 7,
    INDEX_PHALANX_DISTAL: 8,
    INDEX_TIP: 9,

    MIDDLE_METACARPAL: 10,
    MIDDLE_PHALANX_PROXIMAL: 11,
    MIDDLE_PHALANX_INTERMEDIATE: 12,
    MIDDLE_PHALANX_DISTAL: 13,
    MIDDLE_TIP: 14,

    RING_METACARPAL: 15,
    RING_PHALANX_PROXIMAL: 16,
    RING_PHALANX_INTERMEDIATE: 17,
    RING_PHALANX_DISTAL: 18,
    RING_TIP: 19,

    PINKY_METACARPAL: 20,
    PINKY_PHALANX_PROXIMAL: 21,
    PINKY_PHALANX_INTERMEDIATE: 22,
    PINKY_PHALANX_DISTAL: 23,
    PINKY_TIP: 24,
} as const);
export type HandJointIDs = typeof HandJointIDs[keyof typeof HandJointIDs];

export const HandJointChildrenIDs = new Map<number, readonly number[]>([
    [HandJointIDs.WRIST, [
        HandJointIDs.THUMB_METACARPAL,
        HandJointIDs.INDEX_METACARPAL,
        HandJointIDs.MIDDLE_METACARPAL,
        HandJointIDs.RING_METACARPAL,
        HandJointIDs.PINKY_METACARPAL,
    ]],

    [HandJointIDs.THUMB_METACARPAL, [HandJointIDs.THUMB_PHALANX_PROXIMAL]],
    [HandJointIDs.THUMB_PHALANX_PROXIMAL, [HandJointIDs.THUMB_PHALANX_DISTAL]],
    [HandJointIDs.THUMB_PHALANX_DISTAL, [HandJointIDs.THUMB_TIP]],

    [HandJointIDs.INDEX_METACARPAL, [HandJointIDs.INDEX_PHALANX_PROXIMAL]],
    [HandJointIDs.INDEX_PHALANX_PROXIMAL, [HandJointIDs.INDEX_PHALANX_INTERMEDIATE]],
    [HandJointIDs.INDEX_PHALANX_INTERMEDIATE, [HandJointIDs.INDEX_PHALANX_DISTAL]],
    [HandJointIDs.INDEX_PHALANX_DISTAL, [HandJointIDs.INDEX_TIP]],

    [HandJointIDs.MIDDLE_METACARPAL, [HandJointIDs.MIDDLE_PHALANX_PROXIMAL]],
    [HandJointIDs.MIDDLE_PHALANX_PROXIMAL, [HandJointIDs.MIDDLE_PHALANX_INTERMEDIATE]],
    [HandJointIDs.MIDDLE_PHALANX_INTERMEDIATE, [HandJointIDs.MIDDLE_PHALANX_DISTAL]],
    [HandJointIDs.MIDDLE_PHALANX_DISTAL, [HandJointIDs.MIDDLE_TIP]],

    [HandJointIDs.RING_METACARPAL, [HandJointIDs.RING_PHALANX_PROXIMAL]],
    [HandJointIDs.RING_PHALANX_PROXIMAL, [HandJointIDs.RING_PHALANX_INTERMEDIATE]],
    [HandJointIDs.RING_PHALANX_INTERMEDIATE, [HandJointIDs.RING_PHALANX_DISTAL]],
    [HandJointIDs.RING_PHALANX_DISTAL, [HandJointIDs.RING_TIP]],

    [HandJointIDs.PINKY_METACARPAL, [HandJointIDs.PINKY_PHALANX_PROXIMAL]],
    [HandJointIDs.PINKY_PHALANX_PROXIMAL, [HandJointIDs.PINKY_PHALANX_INTERMEDIATE]],
    [HandJointIDs.PINKY_PHALANX_INTERMEDIATE, [HandJointIDs.PINKY_PHALANX_DISTAL]],
    [HandJointIDs.PINKY_PHALANX_DISTAL, [HandJointIDs.PINKY_TIP]],
]);
export function getChildrenIDs(jointID: number) {
    return HandJointChildrenIDs.get(jointID) ?? [];
}
export function getChildrenIDsRecursively(jointID: number) {
    let children = getChildrenIDs(jointID);
    for (let i = 0, len = children.length; i < len; i++) {
        children = children.concat(getChildrenIDsRecursively(children[i]));
    }
    return children;
}

// Note: thumb has no "intermediate" phalanx joint so its array is shorter than the rest.
export const Fingers = Object.freeze({
    THUMB: [HandJointIDs.THUMB_METACARPAL, HandJointIDs.THUMB_PHALANX_PROXIMAL, HandJointIDs.THUMB_PHALANX_DISTAL, HandJointIDs.THUMB_TIP],
    INDEX: [HandJointIDs.INDEX_METACARPAL, HandJointIDs.INDEX_PHALANX_PROXIMAL, HandJointIDs.INDEX_PHALANX_INTERMEDIATE, HandJointIDs.INDEX_PHALANX_DISTAL, HandJointIDs.INDEX_TIP],
    MIDDLE: [HandJointIDs.MIDDLE_METACARPAL, HandJointIDs.MIDDLE_PHALANX_PROXIMAL, HandJointIDs.MIDDLE_PHALANX_INTERMEDIATE, HandJointIDs.MIDDLE_PHALANX_DISTAL, HandJointIDs.MIDDLE_TIP],
    RING: [HandJointIDs.RING_METACARPAL, HandJointIDs.RING_PHALANX_PROXIMAL, HandJointIDs.RING_PHALANX_INTERMEDIATE, HandJointIDs.RING_PHALANX_DISTAL, HandJointIDs.RING_TIP],
    PINKY: [HandJointIDs.PINKY_METACARPAL, HandJointIDs.PINKY_PHALANX_PROXIMAL, HandJointIDs.PINKY_PHALANX_INTERMEDIATE, HandJointIDs.PINKY_PHALANX_DISTAL, HandJointIDs.PINKY_TIP],
});
export type Fingers = typeof Fingers[keyof typeof Fingers];
