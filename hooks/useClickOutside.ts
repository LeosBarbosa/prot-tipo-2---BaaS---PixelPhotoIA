/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { useEffect, useRef } from 'react';

/**
 * Hook customizado para detetar cliques fora de um elemento especificado.
 * @param callback A função a ser chamada quando um clique fora é detetado.
 * @returns Um ref que deve ser anexado ao elemento a ser monitorado.
 */
export const useClickOutside = (callback: () => void) => {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClick = (event: MouseEvent) => {
            if (ref.current && !ref.current.contains(event.target as Node)) {
                callback();
            }
        };

        // Usa 'mousedown' para capturar o evento antes que outros eventos de clique possam ser disparados
        document.addEventListener('mousedown', handleClick, true);

        return () => {
            document.removeEventListener('mousedown', handleClick, true);
        };
    }, [ref, callback]);

    return ref;
};
