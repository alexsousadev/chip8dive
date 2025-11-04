                  onChange={(e) => {
                    const index = parseInt(e.target.value);
                    if (isNaN(index)) return;
                    if (index === selectedRomIndex) return;
                    if (isRunning) {
                      // Mostrar modal de confirmação
                      setPendingRomIndex(index);
                      setShowConfirmModal(true);
                    } else {
                      loadRomFromList(index);
                    }
                  }}


