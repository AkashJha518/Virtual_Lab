
        document.addEventListener('DOMContentLoaded', () => {
            
            // --- 1. WIRING LOGIC ---
            
            const correctConnections = {
                'J_out': ['nand1_in1'],
                'K_out': ['nand2_in1'],
                'CLK_out': ['nand1_in2', 'nand2_in2', 'inv_in'],
                'inv_out': ['nand5_in2', 'nand6_in2'],
                'nand1_out': ['nand3_in1'],
                'nand2_out': ['nand4_in1'],
                'nand3_out': ['nand4_in2', 'nand5_in1'],
                'nand4_out': ['nand3_in2', 'nand6_in1'],
                'nand5_out': ['nand7_in1'],
                'nand6_out': ['nand8_in1'],
                'nand7_out': ['nand8_in2', 'Q_in', 'nand2_in3'],
                'nand8_out': ['nand7_in2', 'Q_bar_in', 'nand1_in3']
            };
            const TOTAL_WIRES = 21;
            
            let selectedNode = null;
            let connectedWires = {};
            let wireCount = 0;
            let circuitComplete = false;

            const simControls = {
                jBtn: document.getElementById('j-toggle'),
                kBtn: document.getElementById('k-toggle'),
                clkBtn: document.getElementById('clk-pulse'),
                resetBtn: document.getElementById('reset-wires'),
                simInstructions: document.getElementById('sim-instructions'),
                simCompleteMsg: document.getElementById('sim-complete-msg')
            };

            const wireLayer = document.getElementById('wire-layer');
            const allNodes = document.querySelectorAll('.node');

            function clearAllHints() {
                allNodes.forEach(n => n.classList.remove('hint-glow'));
            }

            function onNodeClick(e) {
                if (circuitComplete) return; 

                const clickedNodeEl = e.target;
                const clickedNodeId = clickedNodeEl.dataset.node;
                const isInput = clickedNodeEl.classList.contains('in');

                clearAllHints(); 

                if (isInput) {
                    // --- USER CLICKED AN INPUT (BLUE) NODE ---
                    if (selectedNode === null) return; 

                    const outputNodeId = selectedNode;
                    const inputNodeId = clickedNodeId;
                    const wireId = `${outputNodeId}_to_${inputNodeId}`;
                    const outputNodeEl = document.querySelector(`[data-node="${outputNodeId}"]`);
                    
                    outputNodeEl.classList.remove('selected'); 

                    if (correctConnections[outputNodeId]?.includes(inputNodeId) && !connectedWires[wireId]) {
                        // CORRECT
                        connectedWires[wireId] = true;
                        wireCount++;
                        drawWire(outputNodeEl, clickedNodeEl, wireId);
                        if (wireCount === TOTAL_WIRES) {
                            activateSimulator();
                        }
                    } else {
                        // WRONG
                        clickedNodeEl.classList.add('error');
                        setTimeout(() => clickedNodeEl.classList.remove('error'), 500);
                    }
                    selectedNode = null; 

                } else {
                    // --- USER CLICKED AN OUTPUT (ORANGE) NODE ---
                    if (selectedNode === clickedNodeId) {
                        selectedNode = null;
                        clickedNodeEl.classList.remove('selected');
                        return; 
                    }

                    if (selectedNode) {
                        document.querySelector(`[data-node="${selectedNode}"]`).classList.remove('selected');
                    }
                    
                    selectedNode = clickedNodeId;
                    clickedNodeEl.classList.add('selected'); 

                    // --- HINT LOGIC ---
                    const validTargets = correctConnections[clickedNodeId] || [];
                    validTargets.forEach(targetId => {
                        const targetEl = document.querySelector(`[data-node="${targetId}"]`);
                        const wireId = `${selectedNode}_to_${targetId}`;
                        if (targetEl && !connectedWires[wireId]) { 
                            targetEl.classList.add('hint-glow');
                        }
                    });
                }
            }
            
            // --- THIS IS THE MODIFIED FUNCTION ---
            function drawWire(outEl, inEl, wireId) {
                const boardRect = document.getElementById('circuit-board').getBoundingClientRect();
                const outRect = outEl.getBoundingClientRect();
                const inRect = inEl.getBoundingClientRect();

                // Get start and end points
                const x1 = outRect.left + outRect.width / 2 - boardRect.left;
                const y1 = outRect.top + outRect.height / 2 - boardRect.top;
                const x2 = inRect.left + inRect.width / 2 - boardRect.left;
                const y2 = inRect.top + inRect.height / 2 - boardRect.top;

                // Calculate intermediate point for 90-degree bends
                const midX = x1 + (x2 - x1) / 2;

                // Create an <path> element instead of <line>
                const wire = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                
                // Define the path: M = Move, H = Horizontal Line, V = Vertical Line
                const pathData = `M ${x1} ${y1} H ${midX} V ${y2} H ${x2}`;
                
                wire.setAttribute('d', pathData); // Set the path data
                wire.setAttribute('class', 'wire');
                wire.dataset.wireId = wireId;
                wireLayer.appendChild(wire);
            }

            function activateSimulator() {
                circuitComplete = true;
                simControls.simInstructions.style.display = 'none';
                simControls.simCompleteMsg.style.display = 'block';
                simControls.jBtn.disabled = false;
                simControls.kBtn.disabled = false;
                simControls.clkBtn.disabled = false;
                clearAllHints(); 
            }

            function resetSimulator() {
                circuitComplete = false;
                selectedNode = null;
                connectedWires = {};
                wireCount = 0;
                
                wireLayer.innerHTML = '';
                simControls.simInstructions.style.display = 'block';
                simControls.simCompleteMsg.style.display = 'none';
                simControls.jBtn.disabled = true;
                simControls.kBtn.disabled = true;
                simControls.clkBtn.disabled = true;

                J = 0; K = 0; Qm = 0; Qm_bar = 1; Q = 0; Q_bar = 1;
                simControls.jBtn.textContent = 'J = 0';
                simControls.kBtn.textContent = 'K = 0';
                updateVisuals(0);
                
                document.querySelectorAll('#observation-table tbody tr').forEach(row => {
                    const cells = row.querySelectorAll('td');
                    if (cells.length > 0) {
                        cells[2].textContent = '';
                        cells[3].textContent = '';
                        cells[4].textContent = '';
                    }
                });
                
                if (dom.resultPlaceholder) dom.resultPlaceholder.style.display = 'block';
                if (dom.resultContent) dom.resultContent.style.display = 'none';
                clearAllHints();
            }

            allNodes.forEach(node => node.addEventListener('click', onNodeClick));
            simControls.resetBtn.addEventListener('click', resetSimulator);

            // --- 2. LOGIC SIMULATION ---
            let J = 0;
            let K = 0;
            let Qm = 0;
            let Qm_bar = 1;
            let Q = 0;
            let Q_bar = 1;

            const dom = {
                leds: {
                    q: document.querySelector('#output-q .led'),
                    qBar: document.querySelector('#output-qbar .led')
                },
                resultPlaceholder: document.getElementById('result-placeholder'),
                resultContent: document.getElementById('result-content'),
            };

            const NAND = (...inputs) => {
                return inputs.every(i => i === 1) ? 0 : 1;
            };
            
            const updateVisuals = (clkState = 0) => {
                let CLK_BAR = NAND(clkState);
                let S_m = NAND(J, clkState, Q_bar);
                let R_m = NAND(K, clkState, Q);
                
                if (clkState === 1) {
                    Qm = NAND(S_m, Qm_bar);
                    Qm_bar = NAND(R_m, Qm);
                    Qm = NAND(S_m, Qm_bar); 
                    Qm_bar = NAND(R_m, Qm); 
                }
                
                let S_s = NAND(Qm, CLK_BAR);
                let R_s = NAND(Qm_bar, CLK_BAR);

                if (CLK_BAR === 1) {
                    Q = NAND(S_s, Q_bar);
                    Q_bar = NAND(R_s, Q);
                    Q = NAND(S_s, Q_bar); 
                    Q_bar = NAND(R_s, Q); 
                }

                if(dom.leds.q) {
                    dom.leds.q.classList.toggle('led-on', Q === 1);
                    dom.leds.q.classList.toggle('led-off', Q === 0);
                }
                if(dom.leds.qBar) {
                    dom.leds.qBar.classList.toggle('led-on', Q_bar === 1);
                    dom.leds.qBar.classList.toggle('led-off', Q_bar === 0);
                }
            };

            const checkObservationCompletion = () => {
                const rows = document.querySelectorAll('#observation-table tbody tr');
                let isComplete = true;
                rows.forEach(row => {
                    const cells = row.querySelectorAll('td');
                    if (cells.length === 0 || cells[4].textContent.trim() === '') {
                        isComplete = false;
                    }
                });
                if (isComplete) {
                    if (dom.resultPlaceholder) dom.resultPlaceholder.style.display = 'none';
                    if (dom.resultContent) dom.resultContent.style.display = 'block';
                }
            };

            // --- 3. EVENT LISTENERS (Simulator, Table, Precautions) ---
            
            simControls.jBtn.addEventListener('click', () => {
                if (!circuitComplete) return;
                J = J === 0 ? 1 : 0; 
                simControls.jBtn.textContent = `J = ${J}`;
                updateVisuals(0);
            });

            simControls.kBtn.addEventListener('click', () => {
                if (!circuitComplete) return;
                K = K === 0 ? 1 : 0;
                simControls.kBtn.textContent = `K = ${K}`;
                updateVisuals(0);
            });

            simControls.clkBtn.addEventListener('click', () => {
                if (!circuitComplete) return;
                
                updateVisuals(1); 
                simControls.clkBtn.style.backgroundColor = '#00ff00'; 
                
                setTimeout(() => {
                    updateVisuals(0); 
                    simControls.clkBtn.style.backgroundColor = 'rgb(0, 52, 65)'; 
                    
                    let remark = "";
                    if (J === 0 && K === 0) remark = "No Change";
                    else if (J === 0 && K === 1) remark = "Reset";
                    else if (J === 1 && K === 0) remark = "Set";
                    else if (J === 1 && K === 1) remark = "Toggle";

                    const row = document.querySelector(`#observation-table tbody tr[data-j="${J}"][data-k="${K}"]`);
                    if (row) {
                        const cells = row.querySelectorAll('td');
                        cells[2].textContent = Q;      
                        cells[3].textContent = Q_bar;  
                        cells[4].textContent = remark; 
                        row.classList.remove('row-updated');
                        void row.offsetWidth; 
                        row.classList.add('row-updated');
                    }
                    
                    checkObservationCompletion();
                }, 500);
            });

            // Precaution Toggles
            const precautionToggles = document.querySelectorAll('.precaution-toggle');
            precautionToggles.forEach(toggle => {
                toggle.addEventListener('click', () => {
                    const content = toggle.nextElementSibling;
                    const icon = toggle.querySelector('.toggle-icon');
                    toggle.classList.toggle('active');
                    if (toggle.classList.contains('active')) {
                        icon.textContent = '–';
                        content.style.maxHeight = content.scrollHeight + "px";
                    } else {
                        icon.textContent = '+';
                        content.style.maxHeight = null;
                    }
                });
            });

            // Set initial state
            updateVisuals(0);
        });
