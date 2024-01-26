'use client'

import {useCallback, useEffect, useRef, useState} from 'react'
import {gql, useQuery} from '@apollo/client'
import SpriteText from 'three-spritetext'
import * as THREE from 'three'
import {ethers} from 'ethers'
import ForceGraph3D, {ForceGraphMethods} from 'react-force-graph-3d'
import axios from 'axios'
import {abi as EAS} from '@ethereum-attestation-service/eas-contracts/artifacts/contracts/EAS.sol/EAS.json'

const frontendURL = 'http://localhost:3000'
const baseURL = 'http://localhost:8080'
export default function ForceGraph() {
  const rpc = 'https://eth.merkle.io'
  const provider = new ethers.providers.StaticJsonRpcProvider(rpc)
  // const eas = new ethers.Contract('0xA7b39296258348C78294F95B872b282326A97BDF', EAS, provider)

  // const schema = '0xc59265615401143689cbfe73046a922c975c99d97e4c248070435b1104b2dea7'
  const [graph, setGraph] = useState({nodes: [], links: []})

  const [currentLink, setCurrentLink] = useState<any>(null);


  async function update() {
    const graph = await axios.post<{ nodes: any[], links: any[] }>(`${baseURL}/getGraph`);
    const nodes = graph.data.nodes.map(n => ({
      ...n,
      name: n.id,
      type: 'address',
      value: 10
    }));

    setGraph({nodes: nodes as any, links: graph.data.links as any});
  }

  useEffect(() => {
    update()
  }, [])

  // Load blockies.
  let blockies: any
  if (typeof document !== 'undefined') {
    blockies = require('ethereum-blockies')
  }

  // Generate one blockie to hack around a bug in the library.
  blockies?.create({seed: 'fixies!'})

  // Open stuff on click.
  const handleLinkClick = useCallback((link: any) => {
    console.log('l',link)
    setCurrentLink(link);
  }, [])

  // Open stuff on click.
  const handleNodeClick = useCallback((node: any) => {
    if (node.type === 'address') {
      window.open(`https://etherscan.io/address/${node.id}`)
    }
  }, [])

  return (
    <main>
      <div style={{backgroundColor: '#fff', width: 300, display: 'flex-box'}}>
        <div>
          {currentLink && (
            <div>
              <h2>Games played between {currentLink.source.id} and {currentLink.target.id}</h2>
              {currentLink.games.map((game: any) => (
                // eslint-disable-next-line react/jsx-key
                <div onClick={() => {
                  window.location.href = `${frontendURL}/challenge/${game}`
                }}>
                  Game UID {game}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <ForceGraph3D
        graphData={graph}
        nodeAutoColorBy="type"
        linkAutoColorBy="type"
        linkWidth={1}
        linkOpacity={1}
        linkDirectionalArrowLength={3.5}
        linkDirectionalArrowRelPos={1}
        linkDirectionalParticles={1}
        onLinkClick={handleLinkClick}
        onNodeClick={handleNodeClick}
        nodeThreeObject={(node: any) => {
          if (node.type === 'address') {
            const icon = blockies?.create({seed: node.id})
            const data = icon?.toDataURL('image/png')
            const texture = new THREE.TextureLoader().load(data)
            texture.colorSpace = THREE.SRGBColorSpace
            const material = new THREE.SpriteMaterial({map: texture})
            const sprite = new THREE.Sprite(material)
            sprite.scale.set(8, 8, 0)
            return sprite
          } else {
            const sprite = new SpriteText(node.name);
            sprite.color = node.color;
            sprite.textHeight = 4;
            return sprite;
          }
        }}
      />
    </main>
  )
}
