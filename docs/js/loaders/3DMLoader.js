import {
	BufferGeometryLoader,
	FileLoader,
	Loader,
	Object3D,
	MeshStandardMaterial,
	Mesh,
	Color,
	Points,
	PointsMaterial,
	Line,
	LineBasicMaterial,
	Matrix4,
	DirectionalLight,
	PointLight,
	SpotLight,
	RectAreaLight,
	Vector3,
	Sprite,
	SpriteMaterial,
	CanvasTexture,
	LinearFilter,
	ClampToEdgeWrapping,
	TextureLoader
} from '../build/three.module.js';

const _taskCache = new WeakMap();

class Rhino3dmLoader extends Loader {

	constructor( manager ) {

		super( manager );

		this.libraryPath = '';
		this.libraryPending = null;
		this.libraryBinary = null;
		this.libraryConfig = {};

		this.url = '';

		this.workerLimit = 4;
		this.workerPool = [];
		this.workerNextTaskID = 1;
		this.workerSourceURL = '';
		this.workerConfig = {};

		this.materials = [];
		this.warnings = [];

	}

	setLibraryPath( path ) {

		this.libraryPath = path;

		return this;

	}

	setWorkerLimit( workerLimit ) {

		this.workerLimit = workerLimit;

		return this;

	}

	load( url, onLoad, onProgress, onError ) {

		const loader = new FileLoader( this.manager );

		loader.setPath( this.path );
		loader.setResponseType( 'arraybuffer' );
		loader.setRequestHeader( this.requestHeader );

		this.url = url;

		loader.load( url, ( buffer ) => {

			// Check for an existing task using this buffer. A transferred buffer cannot be transferred
			// again from this thread.
			if ( _taskCache.has( buffer ) ) {

				const cachedTask = _taskCache.get( buffer );

				return cachedTask.promise.then( onLoad ).catch( onError );

			}

			this.decodeObjects( buffer, url )
				.then( result => {

					result.userData.warnings = this.warnings;
					onLoad( result );

				 } )
				.catch( e => onError( e ) );

		}, onProgress, onError );

	}

	debug() {

		console.log( 'Task load: ', this.workerPool.map( ( worker ) => worker._taskLoad ) );

	}

	decodeObjects( buffer, url ) {

		let worker;
		let taskID;

		const taskCost = buffer.byteLength;

		const objectPending = this._getWorker( taskCost )
			.then( ( _worker ) => {

				worker = _worker;
				taskID = this.workerNextTaskID ++;

				return new Promise( ( resolve, reject ) => {

					worker._callbacks[ taskID ] = { resolve, reject };

					worker.postMessage( { type: 'decode', id: taskID, buffer }, [ buffer ] );

					// this.debug();

				} );

			} )
			.then( ( message ) => this._createGeometry( message.data ) )
			.catch( e => {

				throw e;

			} );

		// Remove task from the task list.
		// Note: replaced '.finally()' with '.catch().then()' block - iOS 11 support (#19416)
		objectPending
			.catch( () => true )
			.then( () => {

				if ( worker && taskID ) {

					this._releaseTask( worker, taskID );

					//this.debug();

				}

			} );

		// Cache the task result.
		_taskCache.set( buffer, {

			url: url,
			promise: objectPending

		} );

		return objectPending;

	}

	parse( data, onLoad, onError ) {

		this.decodeObjects( data, '' )
			.then( result => {

				result.userData.warnings = this.warnings;
				onLoad( result );

			} )
			.catch( e => onError( e ) );

	}

	_compareMaterials( material ) {

		const mat = {};
		mat.name = material.name;
		mat.color = {};
		mat.color.r = material.color.r;
		mat.color.g = material.color.g;
		mat.color.b = material.color.b;
		mat.type = material.type;

		for ( let i = 0; i < this.materials.length; i ++ ) {

			const m = this.materials[ i ];
			const _mat = {};
			_mat.name = m.name;
			_mat.color = {};
			_mat.color.r = m.color.r;
			_mat.color.g = m.color.g;
			_mat.color.b = m.color.b;
			_mat.type = m.type;

			if ( JSON.stringify( mat ) === JSON.stringify( _mat ) ) {

				return m;

			}

		}

		this.materials.push( material );

		return material;

	}

	_createMaterial( material ) {

		if ( material === undefined ) {

			return new MeshStandardMaterial( {
				color: new Color( 1, 1, 1 ),
				metalness: 0.8,
				name: 'default',
				side: 2
			} );

		}

		const _diffuseColor = material.diffuseColor;

		const diffusecolor = new Color( _diffuseColor.r / 255.0, _diffuseColor.g / 255.0, _diffuseColor.b / 255.0 );

		if ( _diffuseColor.r === 0 && _diffuseColor.g === 0 && _diffuseColor.b === 0 ) {

			diffusecolor.r = 1;
			diffusecolor.g = 1;
			diffusecolor.b = 1;

		}

		// console.log( material );

		const mat = new MeshStandardMaterial( {
			color: diffusecolor,
			name: material.name,
			side: 2,
			transparent: material.transparency > 0 ? true : false,
			opacity: 1.0 - material.transparency
		} );

		const textureLoader = new TextureLoader();

		for ( let i = 0; i < material.textures.length; i ++ ) {

			const texture = material.textures[ i ];

			if ( texture.image !== null ) {

				const map = textureLoader.load( texture.image );

				switch ( texture.type ) {

					case 'Diffuse':

						mat.map = map;

						break;

					case 'Bump':

						mat.bumpMap = map;

						break;

					case 'Transparency':

						mat.alphaMap = map;
						mat.transparent = true;

						break;

					case 'Emap':

						mat.envMap = map;

						break;

				}

			}

		}

		return mat;

	}

	_createGeometry( data ) {

		// console.log(data);

		const object = new Object3D();
		const instanceDefinitionObjects = [];
		const instanceDefinitions = [];
		const instanceReferences = [];

		object.userData[ 'layers' ] = data.layers;
		object.userData[ 'groups' ] = data.groups;
		object.userData[ 'settings' ] = data.settings;
		object.userData[ 'objectType' ] = 'File3dm';
		object.userData[ 'materials' ] = null;
		object.name = this.url;

		let objects = data.objects;
		const materials = data.materials;

		for ( let i = 0; i < objects.length; i ++ ) {

			const obj = objects[ i ];
			const attributes = obj.attributes;

			switch ( obj.objectType ) {

				case 'InstanceDefinition':

					instanceDefinitions.push( obj );

					break;

				case 'InstanceReference':

					instanceReferences.push( obj );

					break;

				default:

					let _object;

					if ( attributes.materialIndex >= 0 ) {

						const rMaterial = materials[ attributes.materialIndex ];
						let material = this._createMaterial( rMaterial );
						material = this._compareMaterials( material );
						_object = this._createObject( obj, material );

					} else {

						const material = this._createMaterial();
						_object = this._createObject( obj, material );

					}

					if ( _object === undefined ) {

						continue;

					}

					const layer = data.layers[ attributes.layerIndex ];

					_object.visible = layer ? data.layers[ attributes.layerIndex ].visible : true;

					if ( attributes.isInstanceDefinitionObject ) {

						instanceDefinitionObjects.push( _object );

					} else {

						object.add( _object );

					}

					break;

			}

		}

		for ( let i = 0; i < instanceDefinitions.length; i ++ ) {

			const iDef = instanceDefinitions[ i ];

			objects = [];

			for ( let j = 0; j < iDef.attributes.objectIds.length; j ++ ) {

				const objId = iDef.attributes.objectIds[ j ];

				for ( let p = 0; p < instanceDefinitionObjects.length; p ++ ) {

					const idoId = instanceDefinitionObjects[ p ].userData.attributes.id;

					if ( objId === idoId ) {

						objects.push( instanceDefinitionObjects[ p ] );

					}

				}

			}

			// Currently clones geometry and does not take advantage of instancing

			for ( let j = 0; j < instanceReferences.length; j ++ ) {

				const iRef = instanceReferences[ j ];

				if ( iRef.geometry.parentIdefId === iDef.attributes.id ) {

					const iRefObject = new Object3D();
					const xf = iRef.geometry.xform.array;

					const matrix = new Matrix4();
          			matrix.set( xf[ 0 ], xf[ 1 ], xf[ 2 ], xf[ 3 ], xf[ 4 ], xf[ 5 ], xf[ 6 ], xf[ 7 ], xf[ 8 ], xf[ 9 ], xf[ 10 ], xf[ 11 ], xf[ 12 ], xf[ 13 ], xf[ 14 ], xf[ 15 ] );

					iRefObject.applyMatrix4( matrix );

					for ( let p = 0; p < objects.length; p ++ ) {

						iRefObject.add( objects[ p ].clone( true ) );

					}

					object.add( iRefObject );

				}

			}

		}

		object.userData[ 'materials' ] = this.materials;
		return object;

	}

	_createObject( obj, mat ) {

		const loader = new BufferGeometryLoader();

		const attributes = obj.attributes;

		let geometry, material, _color, color;

		switch ( obj.objectType ) {

			case 'Point':
			case 'PointSet':

				geometry = loader.parse( obj.geometry );

				if ( geometry.attributes.hasOwnProperty( 'color' ) ) {

					material = new PointsMaterial( { vertexColors: true, sizeAttenuation: false, size: 2 } );

				} else {

					_color = attributes.drawColor;
					color = new Color( _color.r / 255.0, _color.g / 255.0, _color.b / 255.0 );
					material = new PointsMaterial( { color: color, sizeAttenuation: false, size: 2 } );

				}

				material = this._compareMaterials( material );

				const points = new Points( geometry, material );
				points.userData[ 'attributes' ] = attributes;
				points.userData[ 'objectType' ] = obj.objectType;

				if ( attributes.name ) {

					points.name = attributes.name;

				}

				return points;

			case 'Mesh':
			case 'Extrusion':
			case 'SubD':
			case 'Brep':

				if ( obj.geometry === null ) return;

				geometry = loader.parse( obj.geometry );

				if ( geometry.attributes.hasOwnProperty( 'color' ) ) {

					mat.vertexColors = true;

				}

				if ( mat === null ) {

					mat = this._createMaterial();
					mat = this._compareMaterials( mat );

				}

				const mesh = new Mesh( geometry, mat );
				mesh.castShadow = attributes.castsShadows;
				mesh.receiveShadow = attributes.receivesShadows;
				mesh.userData[ 'attributes' ] = attributes;
				mesh.userData[ 'objectType' ] = obj.objectType;

				if ( attributes.name ) {

					mesh.name = attributes.name;

				}

				return mesh;

			case 'Curve':

				geometry = loader.parse( obj.geometry );

				_color = attributes.drawColor;
				color = new Color( _color.r / 255.0, _color.g / 255.0, _color.b / 255.0 );

				material = new LineBasicMaterial( { color: color } );
				material = this._compareMaterials( material );

				const lines = new Line( geometry, material );
				lines.userData[ 'attributes' ] = attributes;
				lines.userData[ 'objectType' ] = obj.objectType;

				if ( attributes.name ) {

					lines.name = attributes.name;

				}

				return lines;

			case 'TextDot':

				geometry = obj.geometry;

				const ctx = document.createElement( 'canvas' ).getContext( '2d' );
				const font = `${geometry.fontHeight}px ${geometry.fontFace}`;
				ctx.font = font;
				const width = ctx.measureText( geometry.text ).width + 10;
				const height = geometry.fontHeight + 10;

				const r = window.devicePixelRatio;

				ctx.canvas.width = width * r;
				ctx.canvas.height = height * r;
				ctx.canvas.style.width = width + 'px';
				ctx.canvas.style.height = height + 'px';
				ctx.setTransform( r, 0, 0, r, 0, 0 );

				ctx.font = font;
				ctx.textBaseline = 'middle';
				ctx.textAlign = 'center';
				color = attributes.drawColor;
				ctx.fillStyle = `rgba(${color.r},${color.g},${color.b},${color.a})`;
				ctx.fillRect( 0, 0, width, height );
				ctx.fillStyle = 'white';
				ctx.fillText( geometry.text, width / 2, height / 2 );

				const texture = new CanvasTexture( ctx.canvas );
				texture.minFilter = LinearFilter;
				texture.wrapS = ClampToEdgeWrapping;
				texture.wrapT = ClampToEdgeWrapping;

				material = new SpriteMaterial( { map: texture, depthTest: false } );
				const sprite = new Sprite( material );
				sprite.position.set( geometry.point[ 0 ], geometry.point[ 1 ], geometry.point[ 2 ] );
				sprite.scale.set( width / 10, height / 10, 1.0 );

				sprite.userData[ 'attributes' ] = attributes;
				sprite.userData[ 'objectType' ] = obj.objectType;

				if ( attributes.name ) {

					sprite.name = attributes.name;

				}

				return sprite;

			case 'Light':

				geometry = obj.geometry;

				let light;

				switch ( geometry.lightStyle.name ) {

					case 'LightStyle_WorldPoint':

						light = new PointLight();
						light.castShadow = attributes.castsShadows;
						light.position.set( geometry.location[ 0 ], geometry.location[ 1 ], geometry.location[ 2 ] );
						light.shadow.normalBias = 0.1;

						break;

					case 'LightStyle_WorldSpot':

						light = new SpotLight();
						light.castShadow = attributes.castsShadows;
						light.position.set( geometry.location[ 0 ], geometry.location[ 1 ], geometry.location[ 2 ] );
						light.target.position.set( geometry.direction[ 0 ], geometry.direction[ 1 ], geometry.direction[ 2 ] );
						light.angle = geometry.spotAngleRadians;
						light.shadow.normalBias = 0.1;

						break;

					case 'LightStyle_WorldRectangular':

						light = new RectAreaLight();
						const width = Math.abs( geometry.width[ 2 ] );
						const height = Math.abs( geometry.length[ 0 ] );
						light.position.set( geometry.location[ 0 ] - ( height / 2 ), geometry.location[ 1 ], geometry.location[ 2 ] - ( width / 2 ) );
						light.height = height;
						light.width = width;
						light.lookAt( new Vector3( geometry.direction[ 0 ], geometry.direction[ 1 ], geometry.direction[ 2 ] ) );

						break;

					case 'LightStyle_WorldDirectional':

						light = new DirectionalLight();
						light.castShadow = attributes.castsShadows;
						light.position.set( geometry.location[ 0 ], geometry.location[ 1 ], geometry.location[ 2 ] );
						light.target.position.set( geometry.direction[ 0 ], geometry.direction[ 1 ], geometry.direction[ 2 ] );
						light.shadow.normalBias = 0.1;

						break;

					case 'LightStyle_WorldLinear':
						// not conversion exists, warning has already been printed to the console
						break;

					default:
						break;

				}

				if ( light ) {

					light.intensity = geometry.intensity;
					_color = geometry.diffuse;
					color = new Color( _color.r / 255.0, _color.g / 255.0, _color.b / 255.0 );
					light.color = color;
					light.userData[ 'attributes' ] = attributes;
					light.userData[ 'objectType' ] = obj.objectType;

				}

				return light;

		}

	}

	_initLibrary() {

		if ( ! this.libraryPending ) {

			// Load rhino3dm wrapper.
			const jsLoader = new FileLoader( this.manager );
			jsLoader.setPath( this.libraryPath );
			const jsContent = new Promise( ( resolve, reject ) => {

				jsLoader.load( 'rhino3dm.js', resolve, undefined, reject );

			} );

			// Load rhino3dm WASM binary.
			const binaryLoader = new FileLoader( this.manager );
			binaryLoader.setPath( this.libraryPath );
			binaryLoader.setResponseType( 'arraybuffer' );
			const binaryContent = new Promise( ( resolve, reject ) => {

				binaryLoader.load( 'rhino3dm.wasm', resolve, undefined, reject );

			} );

			this.libraryPending = Promise.all( [ jsContent, binaryContent ] )
				.then( ( [ jsContent, binaryContent ] ) => {

					//this.libraryBinary = binaryContent;
					this.libraryConfig.wasmBinary = binaryContent;

					const fn = Rhino3dmWorker.toString();

					const body = [
						'/* rhino3dm.js */',
						jsContent,
						'/* worker */',
						fn.substring( fn.indexOf( '{' ) + 1, fn.lastIndexOf( '}' ) )
					].join( '\n' );

					this.workerSourceURL = URL.createObjectURL( new Blob( [ body ] ) );

				} );

		}

		return this.libraryPending;

	}

	_getWorker( taskCost ) {

		return this._initLibrary().then( () => {

			if ( this.workerPool.length < this.workerLimit ) {

				const worker = new Worker( this.workerSourceURL );

				worker._callbacks = {};
				worker._taskCosts = {};
				worker._taskLoad = 0;

				worker.postMessage( {
					type: 'init',
					libraryConfig: this.libraryConfig
				} );

				worker.onmessage = e => {

					const message = e.data;

					switch ( message.type ) {

						case 'warning':
							this.warnings.push( message.data );
							console.warn( message.data );
							break;

						case 'decode':
							worker._callbacks[ message.id ].resolve( message );
							break;

						case 'error':
							worker._callbacks[ message.id ].reject( message );
							break;

						default:
							console.error( 'THREE.Rhino3dmLoader: Unexpected message, "' + message.type + '"' );

					}

				};

				this.workerPool.push( worker );

			} else {

				this.workerPool.sort( function ( a, b ) {

					return a._taskLoad > b._taskLoad ? - 1 : 1;

				} );

			}

			const worker = this.workerPool[ this.workerPool.length - 1 ];

			worker._taskLoad += taskCost;

			return worker;

		} );

	}

	_releaseTask( worker, taskID ) {

		worker._taskLoad -= worker._taskCosts[ taskID ];
		delete worker._callbacks[ taskID ];
		delete worker._taskCosts[ taskID ];

	}

	dispose() {

		for ( let i = 0; i < this.workerPool.length; ++ i ) {

			this.workerPool[ i ].terminate();

		}

		this.workerPool.length = 0;

		return this;

	}

}

/* WEB WORKER */

function Rhino3dmWorker() {

	let libraryPending;
	let libraryConfig;
	let rhino;
	let taskID;

	onmessage = function ( e ) {

		const message = e.data;

		switch ( message.type ) {

			case 'init':

				// console.log(message)
				libraryConfig = message.libraryConfig;
				const wasmBinary = libraryConfig.wasmBinary;
				let RhinoModule;
				libraryPending = new Promise( function ( resolve ) {

					/* Like Basis Loader */
					RhinoModule = { wasmBinary, onRuntimeInitialized: resolve };

					rhino3dm( RhinoModule ); // eslint-disable-line no-undef

				 } ).then( () => {

					rhino = RhinoModule;

				 } );

				break;

			case 'decode':

				taskID = message.id;
				const buffer = message.buffer;
				libraryPending.then( () => {

					try {

						const data = decodeObjects( rhino, buffer );
						self.postMessage( { type: 'decode', id: message.id, data } );

					} catch ( error ) {

						self.postMessage( { type: 'error', id: message.id, error } );

					}

				} );

				break;

		}

	};

	function decodeObjects( rhino, buffer ) {

		const arr = new Uint8Array( buffer );
		const doc = rhino.File3dm.fromByteArray( arr );

		const objects = [];
		const materials = [];
		const layers = [];
		const views = [];
		const namedViews = [];
		const groups = [];

		//Handle objects

		const objs = doc.objects();
		const cnt = objs.count;

		for ( let i = 0; i < cnt; i ++ ) {

			const _object = objs.get( i );

			const object = extractObjectData( _object, doc );

			_object.delete();

			if ( object ) {

				objects.push( object );

			}

		}

		// Handle instance definitions
		// console.log( `Instance Definitions Count: ${doc.instanceDefinitions().count()}` );

		for ( let i = 0; i < doc.instanceDefinitions().count(); i ++ ) {

			const idef = doc.instanceDefinitions().get( i );
			const idefAttributes = extractProperties( idef );
			idefAttributes.objectIds = idef.getObjectIds();

			objects.push( { geometry: null, attributes: idefAttributes, objectType: 'InstanceDefinition' } );

		}

		// Handle materials

		const textureTypes = [
			// rhino.TextureType.Bitmap,
			rhino.TextureType.Diffuse,
			rhino.TextureType.Bump,
			rhino.TextureType.Transparency,
			rhino.TextureType.Opacity,
			rhino.TextureType.Emap
		];

		const pbrTextureTypes = [
			rhino.TextureType.PBR_BaseColor,
			rhino.TextureType.PBR_Subsurface,
			rhino.TextureType.PBR_SubsurfaceScattering,
			rhino.TextureType.PBR_SubsurfaceScatteringRadius,
			rhino.TextureType.PBR_Metallic,
			rhino.TextureType.PBR_Specular,
			rhino.TextureType.PBR_SpecularTint,
			rhino.TextureType.PBR_Roughness,
			rhino.TextureType.PBR_Anisotropic,
			rhino.TextureType.PBR_Anisotropic_Rotation,
			rhino.TextureType.PBR_Sheen,
			rhino.TextureType.PBR_SheenTint,
			rhino.TextureType.PBR_Clearcoat,
			rhino.TextureType.PBR_ClearcoatBump,
			rhino.TextureType.PBR_ClearcoatRoughness,
			rhino.TextureType.PBR_OpacityIor,
			rhino.TextureType.PBR_OpacityRoughness,
			rhino.TextureType.PBR_Emission,
			rhino.TextureType.PBR_AmbientOcclusion,
			rhino.TextureType.PBR_Displacement
		];

		for ( let i = 0; i < doc.materials().count(); i ++ ) {

			const _material = doc.materials().get( i );
			const _pbrMaterial = _material.physicallyBased();

			let material = extractProperties( _material );

			const textures = [];

			for ( let j = 0; j < textureTypes.length; j ++ ) {

				const _texture = _material.getTexture( textureTypes[ j ] );
				if ( _texture ) {

					let textureType = textureTypes[ j ].constructor.name;
					textureType = textureType.substring( 12, textureType.length );
					const texture = { type: textureType };

					const image = doc.getEmbeddedFileAsBase64( _texture.fileName );

					if ( image ) {

						texture.image = 'data:image/png;base64,' + image;

					} else {

						self.postMessage( { type: 'warning', id: taskID, data: {
							message: `THREE.3DMLoader: Image for ${textureType} texture not embedded in file.`,
							type: 'missing resource'
						}

						} );

						texture.image = null;

					}

					textures.push( texture );

					_texture.delete();

				}

			}

			material.textures = textures;

			if ( _pbrMaterial.supported ) {

				for ( let j = 0; j < pbrTextureTypes.length; j ++ ) {

					const _texture = _material.getTexture( pbrTextureTypes[ j ] );
					if ( _texture ) {

						const image = doc.getEmbeddedFileAsBase64( _texture.fileName );
						let textureType = pbrTextureTypes[ j ].constructor.name;
						textureType = textureType.substring( 12, textureType.length );
						const texture = { type: textureType, image: 'data:image/png;base64,' + image };
						textures.push( texture );

						_texture.delete();

					}

				}

				const pbMaterialProperties = extractProperties( _material.physicallyBased() );

				material = Object.assign( pbMaterialProperties, material );

			}

			materials.push( material );

			_material.delete();
			_pbrMaterial.delete();

		}

		// Handle layers

		for ( let i = 0; i < doc.layers().count(); i ++ ) {

			const _layer = doc.layers().get( i );
			const layer = extractProperties( _layer );

			layers.push( layer );

			_layer.delete();

		}

		// Handle views

		for ( let i = 0; i < doc.views().count(); i ++ ) {

			const _view = doc.views().get( i );
			const view = extractProperties( _view );

			views.push( view );

			_view.delete();

		}

		// Handle named views

		for ( let i = 0; i < doc.namedViews().count(); i ++ ) {

			const _namedView = doc.namedViews().get( i );
			const namedView = extractProperties( _namedView );

			namedViews.push( namedView );

			_namedView.delete();

		}

		// Handle groups

		for ( let i = 0; i < doc.groups().count(); i ++ ) {

			const _group = doc.groups().get( i );
			const group = extractProperties( _group );

			groups.push( group );

			_group.delete();

		}

		// Handle settings

		const settings = extractProperties( doc.settings() );

		//TODO: Handle other document stuff like dimstyles, instance definitions, bitmaps etc.

		// Handle dimstyles
		// console.log( `Dimstyle Count: ${doc.dimstyles().count()}` );

		// Handle bitmaps
		// console.log( `Bitmap Count: ${doc.bitmaps().count()}` );

		// Handle strings -- this seems to be broken at the moment in rhino3dm
		// console.log( `Document Strings Count: ${doc.strings().count()}` );

		/*
		for( var i = 0; i < doc.strings().count(); i++ ){

			var _string= doc.strings().get( i );

			console.log(_string);
			var string = extractProperties( _group );

			strings.push( string );

			_string.delete();

		}
		*/

		doc.delete();

		return { objects, materials, layers, views, namedViews, groups, settings };

	}

	function extractObjectData( object, doc ) {

		const _geometry = object.geometry();
		const _attributes = object.attributes();
		let objectType = _geometry.objectType;
		let geometry, attributes, position, data, mesh;

		// skip instance definition objects
		//if( _attributes.isInstanceDefinitionObject ) { continue; }

		// TODO: handle other geometry types
		switch ( objectType ) {

			case rhino.ObjectType.Curve:

				const pts = curveToPoints( _geometry, 100 );

				position = {};
				attributes = {};
				data = {};

				position.itemSize = 3;
				position.type = 'Float32Array';
				position.array = [];

				for ( let j = 0; j < pts.length; j ++ ) {

					position.array.push( pts[ j ][ 0 ] );
					position.array.push( pts[ j ][ 1 ] );
					position.array.push( pts[ j ][ 2 ] );

				}

				attributes.position = position;
				data.attributes = attributes;

				geometry = { data };

				break;

			case rhino.ObjectType.Point:

				const pt = _geometry.location;

				position = {};
				const color = {};
				attributes = {};
				data = {};

				position.itemSize = 3;
				position.type = 'Float32Array';
				position.array = [ pt[ 0 ], pt[ 1 ], pt[ 2 ] ];

				const _color = _attributes.drawColor( doc );

				color.itemSize = 3;
				color.type = 'Float32Array';
				color.array = [ _color.r / 255.0, _color.g / 255.0, _color.b / 255.0 ];

				attributes.position = position;
				attributes.color = color;
				data.attributes = attributes;

				geometry = { data };

				break;

			case rhino.ObjectType.PointSet:
			case rhino.ObjectType.Mesh:

				geometry = _geometry.toThreejsJSON();

				break;

			case rhino.ObjectType.Brep:

				const faces = _geometry.faces();
				mesh = new rhino.Mesh();

				for ( let faceIndex = 0; faceIndex < faces.count; faceIndex ++ ) {

					const face = faces.get( faceIndex );
					const _mesh = face.getMesh( rhino.MeshType.Any );

					if ( _mesh ) {

						mesh.append( _mesh );
						_mesh.delete();

					}

					face.delete();

				}

				if ( mesh.faces().count > 0 ) {

					mesh.compact();
					geometry = mesh.toThreejsJSON();
					faces.delete();

				}

				mesh.delete();

				break;

			case rhino.ObjectType.Extrusion:

				mesh = _geometry.getMesh( rhino.MeshType.Any );

				if ( mesh ) {

					geometry = mesh.toThreejsJSON();
					mesh.delete();

				}

				break;

			case rhino.ObjectType.TextDot:

				geometry = extractProperties( _geometry );

				break;

			case rhino.ObjectType.Light:

				geometry = extractProperties( _geometry );

				if ( geometry.lightStyle.name === 'LightStyle_WorldLinear' ) {

					self.postMessage( { type: 'warning', id: taskID, data: {
						message: `THREE.3DMLoader: No conversion exists for ${objectType.constructor.name} ${geometry.lightStyle.name}`,
						type: 'no conversion',
						guid: _attributes.id
					}

					} );

				}

				break;

			case rhino.ObjectType.InstanceReference:

				geometry = extractProperties( _geometry );
				geometry.xform = extractProperties( _geometry.xform );
				geometry.xform.array = _geometry.xform.toFloatArray( true );

				break;

			case rhino.ObjectType.SubD:

				// TODO: precalculate resulting vertices and faces and warn on excessive results
				_geometry.subdivide( 3 );
				mesh = rhino.Mesh.createFromSubDControlNet( _geometry );
				if ( mesh ) {

					geometry = mesh.toThreejsJSON();
					mesh.delete();

				}

				break;

				/*
				case rhino.ObjectType.Annotation:
				case rhino.ObjectType.Hatch:
				case rhino.ObjectType.ClipPlane:
				*/

			default:

				self.postMessage( { type: 'warning', id: taskID, data: {
					message: `THREE.3DMLoader: Conversion not implemented for ${objectType.constructor.name}`,
					type: 'not implemented',
					guid: _attributes.id
				}

				} );

				break;

		}

		if ( geometry ) {

			attributes = extractProperties( _attributes );
			attributes.geometry = extractProperties( _geometry );

			if ( _attributes.groupCount > 0 ) {

				attributes.groupIds = _attributes.getGroupList();

			}

			if ( _attributes.userStringCount > 0 ) {

				attributes.userStrings = _attributes.getUserStrings();

			}

			if ( _geometry.userStringCount > 0 ) {

				attributes.geometry.userStrings = _geometry.getUserStrings();

			}

			attributes.drawColor = _attributes.drawColor( doc );

			objectType = objectType.constructor.name;
			objectType = objectType.substring( 11, objectType.length );

			return { geometry, attributes, objectType };

		} else {

			self.postMessage( { type: 'warning', id: taskID, data: {
				message: `THREE.3DMLoader: ${objectType.constructor.name} has no associated mesh geometry.`,
				type: 'missing mesh',
				guid: _attributes.id
			}

			} );

		}

	}

	function extractProperties( object ) {

		const result = {};

		for ( const property in object ) {

			const value = object[ property ];

			if ( typeof value !== 'function' ) {

				if ( typeof value === 'object' && value !== null && value.hasOwnProperty( 'constructor' ) ) {

					result[ property ] = { name: value.constructor.name, value: value.value };

				} else {

					result[ property ] = value;

				}

			} else {

				// these are functions that could be called to extract more data.
				//console.log( `${property}: ${object[ property ].constructor.name}` );

			}

		}

		return result;

	}

	function curveToPoints( curve, pointLimit ) {

		let pointCount = pointLimit;
		let rc = [];
		const ts = [];

		if ( curve instanceof rhino.LineCurve ) {

			return [ curve.pointAtStart, curve.pointAtEnd ];

		}

		if ( curve instanceof rhino.PolylineCurve ) {

			pointCount = curve.pointCount;
			for ( let i = 0; i < pointCount; i ++ ) {

				rc.push( curve.point( i ) );

			}

			return rc;

		}

		if ( curve instanceof rhino.PolyCurve ) {

			const segmentCount = curve.segmentCount;

			for ( let i = 0; i < segmentCount; i ++ ) {

				const segment = curve.segmentCurve( i );
				const segmentArray = curveToPoints( segment, pointCount );
				rc = rc.concat( segmentArray );
				segment.delete();

			}

			return rc;

		}

		if ( curve instanceof rhino.ArcCurve ) {

			pointCount = Math.floor( curve.angleDegrees / 5 );
			pointCount = pointCount < 2 ? 2 : pointCount;
			// alternative to this hardcoded version: https://stackoverflow.com/a/18499923/2179399

		}

		if ( curve instanceof rhino.NurbsCurve && curve.degree === 1 ) {

			const pLine = curve.tryGetPolyline();

			for ( let i = 0; i < pLine.count; i ++ ) {

				rc.push( pLine.get( i ) );

			}

			pLine.delete();

			return rc;

		}

		const domain = curve.domain;
		const divisions = pointCount - 1.0;

		for ( let j = 0; j < pointCount; j ++ ) {

			const t = domain[ 0 ] + ( j / divisions ) * ( domain[ 1 ] - domain[ 0 ] );

			if ( t === domain[ 0 ] || t === domain[ 1 ] ) {

				ts.push( t );
				continue;

			}

			const tan = curve.tangentAt( t );
			const prevTan = curve.tangentAt( ts.slice( - 1 )[ 0 ] );

			// Duplicated from THREE.Vector3
			// How to pass imports to worker?

			const tS = tan[ 0 ] * tan[ 0 ] + tan[ 1 ] * tan[ 1 ] + tan[ 2 ] * tan[ 2 ];
			const ptS = prevTan[ 0 ] * prevTan[ 0 ] + prevTan[ 1 ] * prevTan[ 1 ] + prevTan[ 2 ] * prevTan[ 2 ];

			const denominator = Math.sqrt( tS * ptS );

			let angle;

			if ( denominator === 0 ) {

				angle = Math.PI / 2;

			} else {

				const theta = ( tan.x * prevTan.x + tan.y * prevTan.y + tan.z * prevTan.z ) / denominator;
				angle = Math.acos( Math.max( - 1, Math.min( 1, theta ) ) );

			}

			if ( angle < 0.1 ) continue;

			ts.push( t );

		}

		rc = ts.map( t => curve.pointAt( t ) );
		return rc;

	}

}

export { Rhino3dmLoader };
