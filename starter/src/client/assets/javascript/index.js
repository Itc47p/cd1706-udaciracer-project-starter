// PROVIDED CODE BELOW (LINES 1 - 80) DO NOT REMOVE

// The store will hold all information needed globally
let store = {
	track_id: null,
	track_name: null,
	player_id: null,
	player_name: null,
	race_id: null,
}

// We need our javascript to wait until the DOM is loaded
document.addEventListener("DOMContentLoaded", function () {
	onPageLoad()
	setupClickHandlers()
})

async function onPageLoad() {
	console.log("Getting form info for dropdowns!")
	try {
		getTracks()
			.then(tracks => {
				const html = renderTrackCards(tracks)
				renderAt('#tracks', html)
			})

		getRacers()
			.then((racers) => {
				const html = renderRacerCars(racers)
				renderAt('#racers', html)
			})
	} catch (error) {
		console.log("Problem getting tracks and racers :", error.message)
		console.error(error)
	}
}

function setupClickHandlers() {
	document.addEventListener('click', function (event) {
		const { target } = event

		// Race track form field
		if (target.matches('.card.track')) {
			handleSelectTrack(target)
			store.track_id = target.id
			store.track_name = target.innerHTML
		}

		// Racer form field
		if (target.matches('.card.racer')) {
			handleSelectRacer(target)
			store.player_id = target.id
			store.player_name = target.innerHTML
		}

		// Submit create race form
		if (target.matches('#submit-create-race')) {
			event.preventDefault()

			// start race
			handleCreateRace()
		}

		// Handle acceleration click
		if (target.matches('#gas-peddle')) {
			handleAccelerate()
		}

		console.log("Store updated :: ", store)
	}, false)
}

async function delay(ms) {
	try {
		return await new Promise(resolve => setTimeout(resolve, ms));
	} catch (error) {
		console.log("an error shouldn't be possible here")
		console.log(error)
	}
}

// ^ PROVIDED CODE ^ DO NOT REMOVE

// BELOW THIS LINE IS CODE WHERE STUDENT EDITS ARE NEEDED ----------------------------
// TIP: Do a full file search for TODO to find everything that needs to be done for the game to work

// This async function controls the flow of the race, add the logic and error handling
async function handleCreateRace() {
    // Render starting UI
    renderAt('#race', renderRaceStartView(store.track_name));

    // Get player_id and track_id from the store
    const player_id = store.player_id;
    const track_id = store.track_id;

    if (!player_id || !track_id) {
        console.error("Player or track not selected. Please select both to proceed.");
        return;
    }

    try {
        // Call the asynchronous method to create a race
        const race = await createRace(player_id, track_id);

        // Debugging: Log the race object
        // console.log("Race object returned from createRace:", race);

        // Update the store with the race ID from the response
        if (race && race.id) {
            store.race_id = race.id;
            console.log("Race created with ID:", store.race_id);
        } else {
            console.error("Failed to update store with race ID. Race response:", race);
        }

        // Start the countdown
        await runCountdown();

        // Start the race
        await startRace(store.race_id);

        // Run the race
        await runRace(store.race_id);
    } catch (error) {
        console.error("Error in handleCreateRace:", error);
    }
}

function runRace(raceID) {
	return new Promise(resolve => {
		let timeout = 30000; // 30 seconds
		let elapsedTime = 0;

		const raceInterval = setInterval(() => {
			getRace(raceID)
				.then(res => {
					if (!res || typeof res.status === 'undefined') {
						console.error("Invalid response from getRace:", res);
						clearInterval(raceInterval);
						renderAt('#race', resultsView([]));
						resolve({ status: "error", positions: [] });
						return;
					}

					// Handle race progress
					if (res.status === "in-progress") {
						renderAt('#leaderBoard', raceProgress(res.positions));
					}
					// Handle race completion or timeout
					else if (res.status === "finished" || elapsedTime >= timeout) {
						clearInterval(raceInterval);
						if (elapsedTime >= timeout) {
							console.warn("Race timeout reached. Treating as finished.");
						}
						renderAt('#race', resultsView(res.positions || []));
						resolve(res);
					}
				})
				.catch(err => {
					console.error("Problem with getRace request:", err);
					clearInterval(raceInterval);
					renderAt('#race', resultsView([]));
					resolve({ status: "error", positions: [] });
				});

			// Increment elapsed time
			elapsedTime += 500;
		}, 500);
	});
}

async function runCountdown() {
	try {
		// Wait for the DOM to load
		await delay(1000);
		let timer = 3;

		return new Promise(resolve => {
			// Use setInterval to count down every second
			// run this DOM manipulation inside the set interval to decrement the countdown for the user
			const countdown = setInterval(() => {
				// Update the countdown HTML with the current number
				document.getElementById('big-numbers').innerHTML = renderCountdown(timer);

				// clear the interval at 0 and resolve the promise
				if (timer === 0) {
					clearInterval(countdown);
					resolve();
				}
				// Decrement the timer
				timer--;
			}, 1000);
		});
	} catch (error) {
		console.log(error);
	}
}

function handleSelectRacer(target) {
	console.log("selected a racer", target.id)

	// remove class selected from all racer options
	const selected = document.querySelector('#racers .selected')
	if (selected) {
		selected.classList.remove('selected')
	}
	target.classList.add('selected')
}

function handleSelectTrack(target) {
	console.log("selected track", target.id)

	// remove class selected from all track options
	const selected = document.querySelector('#tracks .selected')
	if (selected) {
		selected.classList.remove('selected')
	}

	target.classList.add('selected')
}

function handleAccelerate() {
	console.log("Accelerate button clicked for race ID:", store.race_id);
	// call accelerate
	try {
		accelerate(store.race_id)
		if (!store.race_id) {
			console.warn('NO ID FOUND')
			return;
		}
	} catch (error) {
		console.log("Problem with accelerate request:", error);
	}

}

// HTML VIEWS ------------------------------------------------
// Provided code - do not remove

function renderRacerCars(racers) {
	if (racers.length === 0) {
		return `
			<h4>Loading Racers...</4>
		`
	}

	const results = racers.map(renderRacerCard).join('')

	return `
		<ul id="racers">
			${results}
		</ul>
	`
}

function renderRacerCard(racer) {
	const { id, driver_name, top_speed, acceleration, handling } = racer
	// OPTIONAL: There is more data given about the race cars than we use in the game, if you want to factor in top speed, acceleration, 
	// and handling to the various vehicles, it is already provided by the API!
	return `<h4 class="card racer" id="${id}">${driver_name}</h4>
				<p>Top Speed: ${top_speed}</p>
				<p>Acceleration: ${acceleration}</p>
				<p>Handling: ${handling}</p>	
		`
}

function renderTrackCards(tracks) {
	if (!Array.isArray(tracks)) {
		console.error("Invalid tracks data:", tracks);
		return `<h4>Error loading tracks</h4>`;
	}

	if (tracks.length === 0) {
		return `<h4>Loading Tracks...</h4>`;
	}
	if (tracks === undefined) {
		console.warn("Tracks is undefined, returning empty list");
	}

	const results = tracks.map(renderTrackCard).join('');
	return `<ul id="tracks">${results}</ul>`;
}

function renderTrackCard(track) {
	const { id, name } = track

	return `<h4 id="${id}" class="card track">${name}</h4>`
}

function renderCountdown(count) {
	if (count === 0) {
		return `
			<h2>Race in progress!</h2>
		`;
	}
	return `
		<h2>Race Starts In...</h2>
		<p id="big-numbers">${count}</p>
	`;
}

function renderRaceStartView(track) {
	return `
		<header>
			<h1>Race: ${track.name}</h1>
		</header>
		<main id="two-columns">
			<section id="leaderBoard">
				${renderCountdown(3)}
			</section>

			<section id="accelerate">
				<h2>Directions</h2>
				<p>Click the button as fast as you can to make your racer go faster!</p>
				<button id="gas-peddle">Click Me To Win!</button>
			</section>
		</main>
		<footer></footer>
	`
}

function resultsView(positions) {
	userPlayer.driver_name += " (you)"
	let count = 1

	const results = positions.map(p => {
		return `
			<tr>
				<td>
					<h3>${count++} - ${p.driver_name}</h3>
				</td>
			</tr>
		`
	})

	return `
		<header>
			<h1>Race Results</h1>
		</header>
		<main>
			<h3>Race Results</h3>
			<p>The race is done! Here are the final results:</p>
			${results.join('')}
			<a href="/race">Start a new race</a>
		</main>
	`
}

function raceProgress(positions) {
	let userPlayer = positions.find(e => e.id === parseInt(store.player_id))
	userPlayer.driver_name += " (you)"

	positions = positions.sort((a, b) => (a.segment > b.segment) ? -1 : 1)
	let count = 1

	const results = positions.map(p => {
		return `
			<tr>
				<td>
					<h3>${count++} - ${p.driver_name}</h3>
				</td>
			</tr>
		`
	})

	return `
		<table>
			${results.join('')}
		</table>
	`
}

function renderAt(element, html) {
	const node = document.querySelector(element)

	node.innerHTML = html
}

// ^ Provided code ^ do not remove


// API CALLS ------------------------------------------------

const SERVER = 'http://localhost:3001'

function defaultFetchOpts() {
	return {
		mode: 'cors',
		headers: {
			'Content-Type': 'application/json',
			'Access-Control-Allow-Origin': SERVER,
		},
	}
}

// TODO - Make a fetch call (with error handling!) to each of the following API endpoints 
// GET request to `${SERVER}/api/tracks`
// TODO: Fetch tracks
// TIP: Don't forget a catch statement!
async function getTracks() {
	try {
		const response = await fetch(`${SERVER}/api/tracks`, {
			method: 'GET',
			...defaultFetchOpts(),
		});
		if (!response.ok) {
			throw new Error(`Failed to fetch tracks: ${response.status} ${response.statusText}`);
		}
		const data = await response.json();
		if (!Array.isArray(data)) {
			throw new Error("Invalid data format: Expected an array of tracks");
		}
		return data;
	} catch (err) {
		console.log("Problem with getTracks request:", err);
		console.log(`calling server :: ${SERVER}/api/tracks`);
		return [];
	}
}

async function getRacers() {
	try {
		const response = await fetch(`${SERVER}/api/cars`, {
			method: 'GET',
			...defaultFetchOpts(),
		});
		return await response.json();
	} catch (err) {
		console.log("Problem with getRacers request:", err);
		return;
	}
	// GET request to `${SERVER}/api/cars`
	// TODO: Fetch racers
}

async function createRace(player_id, track_id) {
    player_id = parseInt(player_id);
    track_id = parseInt(track_id);
    const body = { player_id, track_id };

    try {
        const response = await fetch(`${SERVER}/api/races`, {
            method: 'POST',
            ...defaultFetchOpts(),
            body: JSON.stringify(body),
        });
        const race = await response.json();

        // Debugging: Log the response
        // console.log("createRace response:", race);
		// console.log("createRace request body:", body);

        // Update race_id in the store
        if (race && race.ID) {
            store.race_id = race.ID; // Update the store
            console.log("Updated store with race ID:", store.race_id);
        } else {
            console.error("Race ID not found in response:", race);
        }

        return race;
    } catch (err) {
        console.log("Problem with createRace request:", err);
        return;
    }
}

async function getRace(id) {
    try {
        const response = await fetch(`${SERVER}/api/races/${id}`, {
            method: 'GET',
            ...defaultFetchOpts(),
        });
        const race = await response.json();
        return race;
    } catch (err) {
        console.log("Problem with getRace request:", err);
    }
}

// GET request to `${SERVER}/api/races/${id}`

async function startRace(id) {
	try {
		const response = await fetch(`${SERVER}/api/races/${id}/start`, {
			method: 'POST',
			...defaultFetchOpts(),
		});
		return await response;
	} catch (err) {
		console.log("Problem with startRace request:", err);
	}
}

// POST request to `${SERVER}/api/races/${id}/accelerate`
// options parameter provided as defaultFetchOpts
// no body or datatype needed for this request
async function accelerate(id) {
	try {
		const response = await fetch(`${SERVER}/api/races/${id}/accelerate`, {
			method: 'POST',
			...defaultFetchOpts(),
		});
		return await response;
	} catch (err) {
		console.log("Problem with accelerate request:", err);
	}
}
