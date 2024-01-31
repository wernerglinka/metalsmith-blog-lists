/* global describe, it */

'use strict';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
import * as chai from 'chai';
import metalsmith from 'metalsmith';
//import { name } from '../package.json' assert { type: 'json' };
import plugin from '../lib/index.js';
import layouts from '@metalsmith/layouts';
import fs from 'fs';
import path from 'path';

// ESM does not currently import JSON modules by default.
// Ergo we'll JSON.parse the file manually

const { name } = JSON.parse( fs.readFileSync( './package.json' ) );

const { expect } = chai;

/* eslint-disable no-underscore-dangle */
const __dirname = dirname( fileURLToPath( import.meta.url ) );

const fixture = path.resolve.bind( path, __dirname, 'fixtures' );

function file( _path ) {
  return fs.readFileSync( fixture( _path ), 'utf8' );
}

describe( 'metalsmith-blog-lists', function () {
  it( 'should export a named plugin function matching package.json name', function () {
    const camelCased = name.split( '' ).reduce( ( str, char, i ) => {
      str += name[ i - 1 ] === '-' ? char.toUpperCase() : char === '-' ? '' : char;
      return str;
    }, '' );
    expect( plugin().name ).to.be.eql( camelCased.replace( /~/g, '' ) );
  } );

  it( 'should not crash the metalsmith build when using default options', function ( done ) {
    metalsmith( fixture( 'default' ) )
      .use( plugin() )
      .build( ( err ) => {
        if ( err ) {
          return done( err );
        }
        expect( file( 'default/build/index.html' ) ).to.be.eql( file( 'default/expected/index.html' ) );
        done();
      } );
  } );

  it( 'should place a latest blogs array with 4 entries into metadata', function ( done ) {
    metalsmith( fixture( 'latestBlogsList' ) )
      .use( plugin( {
        latestQuantity: 4,
        fileExtension: ".html",
        blogDirectoryName: "blog"
      } ) )
      .use( layouts( {
        engineOptions: {
          path: [ `${ fixture( 'latestBlogsList' ) }/layouts` ]
        }
      } ) )
      .build( ( err ) => {
        if ( err ) {
          return done( err );
        }
        expect( file( 'latestBlogsList/build/index.html' ) ).to.be.eql( file( 'latestBlogsList/expected/index.html' ) );
        done();
      } );
  } );

  it( 'should place a featured blogs array with 3 entries in "desc" order into metadata', function ( done ) {
    metalsmith( fixture( 'featuredBlogList-desc' ) )
      .use( plugin( {
        featuredQuantity: 3,
        featuredPostSortOrder: "desc",
        fileExtension: ".html",
        blogDirectoryName: "blog"
      } ) )
      .use( layouts( {
        engineOptions: {
          path: [ `${ fixture( 'featuredBlogList-desc' ) }/layouts` ]
        }
      } ) )
      .build( ( err ) => {
        if ( err ) {
          return done( err );
        }
        expect( file( 'featuredBlogList-desc/build/index.html' ) ).to.be.eql( file( 'featuredBlogList-desc/expected/index.html' ) );
        done();
      } );
  } );

  it( 'should place a featured blogs array with 3 entries in "asc" order into metadata', function ( done ) {
    metalsmith( fixture( 'featuredBlogList-desc' ) )
      .use( plugin( {
        featuredQuantity: 3,
        featuredPostSortOrder: "asc",
        fileExtension: ".html",
        blogDirectoryName: "blog"
      } ) )
      .use( layouts( {
        engineOptions: {
          path: [ `${ fixture( 'featuredBlogList-asc' ) }/layouts` ]
        }
      } ) )
      .build( ( err ) => {
        if ( err ) {
          return done( err );
        }
        expect( file( 'featuredBlogList-asc/build/index.html' ) ).to.be.eql( file( 'featuredBlogList-asc/expected/index.html' ) );
        done();
      } );
  } );

  it( 'should place an annualized array of all blogs into metadata', function ( done ) {
    metalsmith( fixture( 'annualBlogList' ) )
      .use( plugin( {
        fileExtension: ".html",
        blogDirectoryName: "blog"
      } ) )
      .use( layouts( {
        engineOptions: {
          path: [ `${ fixture( 'annualBlogList' ) }/layouts` ]
        }
      } ) )
      .build( ( err ) => {
        if ( err ) {
          return done( err );
        }
        expect( file( 'annualBlogList/build/index.html' ) ).to.be.eql( file( 'annualBlogList/expected/index.html' ) );
        done();
      } );
  } );

  it( 'should place a sorted array of all blogs into metadata', function ( done ) {
    metalsmith( fixture( 'allBlogsList' ) )
      .use( plugin( {
        fileExtension: ".html",
        blogDirectoryName: "blog"
      } ) )
      .use( layouts( {
        engineOptions: {
          path: [ `${ fixture( 'allBlogsList' ) }/layouts` ]
        }
      } ) )
      .build( ( err ) => {
        if ( err ) {
          return done( err );
        }
        expect( file( 'allBlogsList/build/index.html' ) ).to.be.eql( file( 'allBlogsList/expected/index.html' ) );
        done();
      } );
  } );

} )



