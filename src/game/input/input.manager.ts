// src/game/input/input.manager.ts

export class InputManager {
	private pressedKeys = new Set<string>();

	public initialize(): void {
		window.addEventListener(
			'keydown',
			this.handleKeyDown
		);

		window.addEventListener(
			'keyup',
			this.handleKeyUp
		);
	}

	public destroy(): void {
		window.removeEventListener(
			'keydown',
			this.handleKeyDown
		);

		window.removeEventListener(
			'keyup',
			this.handleKeyUp
		);
	}

	public isPressed(key: string): boolean {
		return this.pressedKeys.has(key);
	}

    private handleKeyDown = (
        event: KeyboardEvent
    ): void => {
        const blockedKeys = new Set([
            'Space',
            'ArrowUp',
            'ArrowDown',
            'ArrowLeft',
            'ArrowRight'
        ]);

        if (blockedKeys.has(event.code)) {
            event.preventDefault();
        }

        this.pressedKeys.add(event.code);
    };
    
	private handleKeyUp = (
		event: KeyboardEvent
	): void => {
		this.pressedKeys.delete(event.code);
	};
}