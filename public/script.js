fetch('/plants/1')
  .then(res => res.json())
  .then(plants => {
    const list = document.getElementById('plant-list');
    plants.forEach(p => {
      const el = document.createElement('div');
      el.innerText = `${p.nickname} the ${p.species}`;
      list.appendChild(el);
    });
  });