"use client";
import {useEffect} from "react";
import axios from "axios";
import {useDispatch, useSelector} from "react-redux";
import {setMachines} from "../../redux/reducers/machinesReducer";
import {selectMachine} from "../../redux/reducers/selectedMachineReducer";
import {RootState} from "../../redux/store";
import Machine from "../../types/machine";

const MachineList = () => {

    const dispatch = useDispatch();
    useEffect(() => {
        axios.get("/api/getMachines").then((response) => {
            dispatch(setMachines(response.data as Machine[]));
        }).catch((error) => {
            console.log("Error fetching machines: " + error);
        });
    }, [dispatch]);

    const machines = useSelector((state : RootState) => state.machines);

    const handleMachineChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        if(event.target.value != "") dispatch(selectMachine(machines.filter((machine) => machine.machine_id === event.target.value)[0]));
    }

    return (
        <select className="w-full text-xl" id="machine" onChange={handleMachineChange}>
                    <option value="">Select a machine</option>
                    {machines.map((machine) => (
                        <option key="machine.machine_id" value={machine.machine_id}>{machine.manufacturer} {machine.model}</option>
                    ))}
        </select>
    )
}

export default MachineList;
