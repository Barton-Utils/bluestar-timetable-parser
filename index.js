const fetch = require('node-fetch');
const fs = require('fs');

const start = Date.now();

async function Main(){
    const resMain = await fetch('https://www.bluestarbus.co.uk/services');
    const dataMain = await resMain.text();
    const busses = dataMain.split('<li class="operator-lines__item">');
    
    busses.shift();
    busses[busses.length - 1] = busses[busses.length - 1].split('<aside role="')[0]
    
    for (let i = 0; i < busses.length; i++) {
        const formedURL = `https://www.bluestarbus.co.uk${busses[i].split('class="operator-line-')[0].split('href="')[1].split('?')[0]}`
        const busID = formedURL.split('/')[5]
        busses[i] = {
            id: busID,
            url: formedURL
        }
    }

    for (let i = 0; i < busses.length; i++) {
        const res = await fetch(busses[i].url + '?all=on');
        const data = await res.text()
        const details = data.split('<table class="line-timetable__table">')
        const timetable = details.pop().split('<div class="line-timetable__loader">')[0];
        
        if (timetable === undefined) {
            busses[i] = {
                id: busses[i].id,
                url: busses[i].url,
                timetable: [],
            };
        } else {
            const body = timetable.split('<tbody>')
            let main = body.pop();
            main = main.split('</table>')[0]
            main = main.replace(/(<span aria-hidden="true">-<\/span>)/gi, '--:--').replace(/(<tr class="line-timetable__row--principle">)/gi, '')

            const stops = main.split('<tr><th')
            for (let i = 0; i < stops.length; i++) {
                const times = stops[i].split('<td>')
                times.shift()

                for (let i = 0; i < times.length; i++) {
                    times[i] = times[i].split('</td>')[0].trim()
                }

                stops[i] = { name: stops[i].split('">')[2].split('</a></th>')[0], times: times }

            }
            busses[i] = {
                id: busses[i].id,
                url: busses[i].url,
                timetable: stops,
            };
        }
    }
    fs.writeFileSync('./timetable.json', JSON.stringify(busses, null, '\t'))
    console.log(`Timetable created in ${Date.now() - start}ms`)
}

Main();