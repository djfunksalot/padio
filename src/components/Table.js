import React from 'react';
const Table = ({ droplets }) => {
  return (
    <table>
      <thead>
        <tr>
          <th>Run Id</th>
          <th>Chip Id</th>
          <th>Min Voltage</th>
          <th>Max Voltage</th>
          <th>date</th>
        </tr>
      </thead>
      <tbody>
        { (droplets.length > 0) ? droplets.map( (droplet, index) => {
           return (
            <tr key={ index }>
              <td><a href={`/chip?${droplet.run_id}`}>{ droplet.run_id }</a></td>
              <td>{ droplet.chip_id }</td>
              <td>{ droplet.vmin}</td>
              <td>{ droplet.vmax }</td>
              <td>{ droplet.date.toString() }</td>
            </tr>
          )
         }) : <tr><td colSpan="5">Loading...</td></tr> }
      </tbody>
    </table>
  );
}

export default Table
