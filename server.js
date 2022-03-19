const express = require( 'express' );
const bodyParser = require( 'body-parser' );
const cors = require( 'cors' );

const app = express();

app.use( cors() );
app.use( bodyParser.json() );
app.use( bodyParser.urlencoded( { extended: false } ) );

const PORT = 4110;

let clients = [];
let facts = [];

const eventsHandler = ( request, response, next ) => {
	const headers = {
		'Content-Type': 'text/event-stream',
		'Connection': 'keep-alive',
		'Cache-Control': 'no-cache'
	};
	response.writeHead( 200, headers );

	const data = `data: ${ JSON.stringify( facts ) }\n\n`;

	response.write( data );

	const clientId = request.params.channel;

	const newClient = {
		id: clientId,
		response
	};

	clients.push( newClient );

	request.on( 'close', () => {
		console.log( `${ clientId } Connection closed` );
		clients = clients.filter( client => client.id !== clientId );
	} );
}

const sendEvent = ( newFact ) => {
	// Broadcast
	if ( !newFact.channel || newFact.channel === "*" ) {
		clients.forEach( client => client.response.write( `data: ${ JSON.stringify( newFact ) }\n\n` ) );
		return
	}

	// Singlecast
	clients.forEach( ( client ) => {
		if ( newFact.channel === client.id ) {
			client.response.write( `data: ${ JSON.stringify( newFact ) }\n\n` );
		}
	} );

	return;
}

const addFact = async ( request, response, next ) => {
	const newFact = request.body;
	facts.push( newFact );
	response.json( newFact )
	return sendEvent( newFact );
}

app.post( '/fact', addFact );

app.get( '/events/:channel', eventsHandler );

app.get( '/status', ( request, response ) => {

	const c = clients.map( ( client, i ) => {
		return {
			client: `${ i + 1 }: ${ client.id }`
		};
	} );

	response.json( { clients: c } )
} );


setInterval( function() {
	const msg = Math.random();

	const keep_alive = {
		channel: '*',
		info: `pulse:${ msg }`,
		source: 'EventSource'
	}

	sendEvent( keep_alive )
}, 10000 );


app.listen( PORT, () => {
	console.log( `Facts Events service listening pn port ${ PORT }` )
} )