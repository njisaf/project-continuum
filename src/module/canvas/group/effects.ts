class EffectsCanvasGroupAvant extends EffectsCanvasGroup {
    /** Is rules-based vision enabled and applicable to the scene? */
    get rulesBasedVision(): boolean {
        return game.avant.settings.rbv && canvas.ready && !!canvas.scene?.tokenVision;
    }
}

export { EffectsCanvasGroupAvant };
