
const componentsCount = 1000;
const ebikeCount = 1000;

const data = {
    motori: Array.from({ length: componentsCount }, (_, i) => ({ id: `M-${i}`, marca: 'Brand', modello: `Model ${i}`, valutazione: 8 })),
    batterie: Array.from({ length: componentsCount }, (_, i) => ({ id: `B-${i}`, marca: 'Brand', modello: `Model ${i}`, valutazione: 8 })),
    freni: Array.from({ length: componentsCount }, (_, i) => ({ id: `F-${i}`, marca: 'Brand', modello: `Model ${i}`, valutazione: 8 })),
    sospensioni: Array.from({ length: componentsCount }, (_, i) => ({ id: `S-${i}`, marca: 'Brand', modello: `Model ${i}`, valutazione: 8 })),
    e_bikes: Array.from({ length: ebikeCount }, (_, i) => ({
        id: `EB-${i}`,
        modello: `Bike ${i}`,
        id_motore: `M-${i % componentsCount}`,
        id_batteria: `B-${i % componentsCount}`,
        id_freni: `F-${i % componentsCount}`,
        id_forcella: `S-${i % componentsCount}`,
        id_ammortizzatore: `S-${(i + 1) % componentsCount}`
    }))
};

function calculateCompositeScoreFind(eBike, allData) {
    const motore = allData.motori.find(m => m.id === eBike.id_motore);
    const batteria = allData.batterie.find(b => b.id === eBike.id_batteria);
    const freni = allData.freni.find(f => f.id === eBike.id_freni);
    const forcella = allData.sospensioni.find(s => s.id === eBike.id_forcella);
    const ammortizzatore = allData.sospensioni.find(s => s.id === eBike.id_ammortizzatore);

    let totalScore = 0;
    if (motore && motore.valutazione) totalScore += motore.valutazione;
    if (batteria && batteria.valutazione) totalScore += batteria.valutazione;
    return totalScore;
}

function calculateCompositeScoreMap(eBike, maps) {
    const motore = maps.motori.get(eBike.id_motore);
    const batteria = maps.batterie.get(eBike.id_batteria);
    const freni = maps.freni.get(eBike.id_freni);
    const forcella = maps.sospensioni.get(eBike.id_forcella);
    const ammortizzatore = maps.sospensioni.get(eBike.id_ammortizzatore);

    let totalScore = 0;
    if (motore && motore.valutazione) totalScore += motore.valutazione;
    if (batteria && batteria.valutazione) totalScore += batteria.valutazione;
    return totalScore;
}

console.log(`Running benchmark with ${ebikeCount} e-bikes and ${componentsCount} components per category...`);

// Baseline: .find()
console.time('Baseline (.find)');
data.e_bikes.forEach(bike => calculateCompositeScoreFind(bike, data));
console.timeEnd('Baseline (.find)');

// Optimized: Map
const maps = {
    motori: new Map(data.motori.map(m => [m.id, m])),
    batterie: new Map(data.batterie.map(b => [b.id, b])),
    freni: new Map(data.freni.map(f => [f.id, f])),
    sospensioni: new Map(data.sospensioni.map(s => [s.id, s]))
};

console.time('Optimized (Map)');
data.e_bikes.forEach(bike => calculateCompositeScoreMap(bike, maps));
console.timeEnd('Optimized (Map)');
